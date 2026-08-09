import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdapter } from "@/lib/adapters/registry";
import {
  getOneDriveSpecialFolder,
  type OneDriveSpecialFolderName,
} from "@/lib/adapters/onedrive";
import { getAccountCredentials } from "@/lib/services/accounts";
import type { NormalizedFile } from "@/lib/adapters/types";

type Supabase = SupabaseClient;

const ONEDRIVE_SPECIAL_FOLDERS: OneDriveSpecialFolderName[] = [
  "photos",
  "cameraroll",
];

/** Pages to fetch when browsing a folder (not full account sync). */
export const BROWSE_REFRESH_MAX_PAGES = 6;

const UPSERT_BATCH_SIZE = 80;

export async function upsertFileMetadata(
  supabase: Supabase,
  userId: string,
  accountId: string,
  file: NormalizedFile,
  parentId: string | null
): Promise<string | null> {
  const { data: upserted, error } = await supabase
    .from("file_metadata")
    .upsert(
      {
        user_id: userId,
        account_id: accountId,
        provider_file_id: file.providerFileId,
        name: file.name,
        path: file.path,
        mime_type: file.mimeType,
        size: file.size,
        is_folder: file.isFolder,
        is_starred: file.isStarred,
        is_shared: file.isShared,
        parent_id: parentId,
        modified_at: file.modifiedAt?.toISOString() ?? null,
        synced_at: new Date().toISOString(),
      },
      { onConflict: "account_id,provider_file_id" }
    )
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return upserted?.id ?? null;
}

function toMetadataRow(
  userId: string,
  accountId: string,
  file: NormalizedFile,
  parentId: string | null
) {
  return {
    user_id: userId,
    account_id: accountId,
    provider_file_id: file.providerFileId,
    name: file.name,
    path: file.path,
    mime_type: file.mimeType,
    size: file.size,
    is_folder: file.isFolder,
    is_starred: file.isStarred,
    is_shared: file.isShared,
    parent_id: parentId,
    modified_at: file.modifiedAt?.toISOString() ?? null,
    synced_at: new Date().toISOString(),
  };
}

export async function upsertFileMetadataBatch(
  supabase: Supabase,
  userId: string,
  accountId: string,
  files: NormalizedFile[],
  parentId: string | null
): Promise<void> {
  for (let index = 0; index < files.length; index += UPSERT_BATCH_SIZE) {
    const batch = files.slice(index, index + UPSERT_BATCH_SIZE);
    const { error } = await supabase.from("file_metadata").upsert(
      batch.map((file) => toMetadataRow(userId, accountId, file, parentId)),
      { onConflict: "account_id,provider_file_id" }
    );

    if (error) {
      throw new Error(error.message);
    }
  }
}

async function removeStaleFolderChildren(
  supabase: Supabase,
  userId: string,
  accountId: string,
  parentId: string | null,
  freshProviderIds: Set<string>
): Promise<void> {
  let query = supabase
    .from("file_metadata")
    .select("id, provider_file_id")
    .eq("user_id", userId)
    .eq("account_id", accountId);

  if (parentId) {
    query = query.eq("parent_id", parentId);
  } else {
    query = query.is("parent_id", null);
  }

  const { data: existing, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const staleIds = (existing ?? [])
    .filter((row) => !freshProviderIds.has(row.provider_file_id))
    .map((row) => row.id);

  if (staleIds.length === 0) return;

  const { error: deleteError } = await supabase
    .from("file_metadata")
    .delete()
    .in("id", staleIds)
    .eq("user_id", userId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }
}

async function ensureOneDriveSpecialFolders(
  supabase: Supabase,
  userId: string,
  accountId: string,
  credentials: Parameters<typeof getOneDriveSpecialFolder>[0]
): Promise<void> {
  for (const name of ONEDRIVE_SPECIAL_FOLDERS) {
    const folder = await getOneDriveSpecialFolder(credentials, name);
    if (!folder) continue;
    await upsertFileMetadata(supabase, userId, accountId, folder, null);
  }
}

export interface RefreshFolderOptions {
  parentId: string | null;
  accountId: string;
  maxListPages?: number;
  removeStale?: boolean;
}

/**
 * Fetch direct children from the cloud provider and mirror them in file_metadata.
 * Used when browsing folders so the UI reflects the provider without a full sync.
 */
export async function refreshFolderFromProvider(
  supabase: Supabase,
  userId: string,
  options: RefreshFolderOptions
): Promise<number> {
  const {
    parentId,
    accountId,
    maxListPages = BROWSE_REFRESH_MAX_PAGES,
    removeStale = false,
  } = options;
  const { account, credentials } = await getAccountCredentials(
    supabase,
    accountId,
    userId
  );
  const adapter = getAdapter(account.provider);

  if (account.provider === "onedrive" && !parentId) {
    await ensureOneDriveSpecialFolders(
      supabase,
      userId,
      accountId,
      credentials
    );
  }

  let providerPath = "/";
  if (parentId) {
    const { data: parent, error } = await supabase
      .from("file_metadata")
      .select("id, provider_file_id, is_folder, account_id")
      .eq("id", parentId)
      .eq("user_id", userId)
      .eq("account_id", accountId)
      .single();

    if (error || !parent?.is_folder) {
      throw new Error("Folder not found");
    }

    providerPath = parent.provider_file_id;
  }

  const children = await adapter.listFiles(credentials, providerPath, {
    maxPages: maxListPages,
  });
  const freshProviderIds = new Set(children.map((child) => child.providerFileId));

  await upsertFileMetadataBatch(
    supabase,
    userId,
    accountId,
    children,
    parentId
  );

  if (removeStale) {
    await removeStaleFolderChildren(
      supabase,
      userId,
      accountId,
      parentId,
      freshProviderIds
    );
  }

  return children.length;
}

export async function refreshProviderRoots(
  supabase: Supabase,
  userId: string,
  provider: string
): Promise<void> {
  const { data: accounts, error } = await supabase
    .from("cloud_accounts")
    .select("id")
    .eq("user_id", userId)
    .eq("provider", provider)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  for (const account of accounts ?? []) {
    await refreshFolderFromProvider(supabase, userId, {
      parentId: null,
      accountId: account.id,
      maxListPages: BROWSE_REFRESH_MAX_PAGES,
      removeStale: false,
    });
  }
}

const REFRESH_TIMEOUT_MS = 12_000;

export async function refreshFolderWithTimeout(
  supabase: Supabase,
  userId: string,
  options: RefreshFolderOptions
): Promise<void> {
  await Promise.race([
    refreshFolderFromProvider(supabase, userId, options),
    new Promise<void>((_, reject) => {
      setTimeout(
        () => reject(new Error("Folder refresh timed out")),
        REFRESH_TIMEOUT_MS
      );
    }),
  ]);
}
