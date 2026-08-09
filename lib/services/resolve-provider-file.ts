import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdapter } from "@/lib/adapters/registry";
import { getOneDriveSpecialFolder } from "@/lib/adapters/onedrive";
import type { NormalizedFile, ProviderCredentials } from "@/lib/adapters/types";
import { getAccountCredentials } from "@/lib/services/accounts";
import type { CloudProvider, FileMetadata } from "@/lib/types/database";
import { generateDrivePathVariants } from "@/lib/utils/onedrive-path";
import {
  isProviderItemNotFound,
  providerFileNotFoundMessage,
} from "@/lib/utils/provider-file-error";

type Supabase = SupabaseClient;

const MOVE_LIST_MAX_PAGES = 80;

async function loadFolderMetadata(
  supabase: Supabase,
  userId: string,
  folderId: string
): Promise<FileMetadata | null> {
  const { data, error } = await supabase
    .from("file_metadata")
    .select("*")
    .eq("id", folderId)
    .eq("user_id", userId)
    .single();

  if (error || !data?.is_folder) return null;
  return data as FileMetadata;
}

async function buildBreadcrumbSegments(
  supabase: Supabase,
  userId: string,
  file: FileMetadata
): Promise<string[]> {
  const segments = [file.name];
  const seen = new Set<string>();
  let parentId = file.parent_id;

  while (parentId && !seen.has(parentId) && segments.length < 64) {
    seen.add(parentId);
    const { data, error } = await supabase
      .from("file_metadata")
      .select("name, parent_id, is_folder")
      .eq("id", parentId)
      .eq("user_id", userId)
      .single();

    if (error || !data?.is_folder) break;
    segments.unshift(data.name);
    parentId = data.parent_id;
  }

  return segments;
}

async function providerItemExists(
  credentials: ProviderCredentials,
  provider: CloudProvider,
  providerFileId: string
): Promise<boolean> {
  const adapter = getAdapter(provider);
  try {
    await adapter.getFile(credentials, providerFileId);
    return true;
  } catch (error) {
    if (isProviderItemNotFound(error)) return false;
    throw error;
  }
}

async function tryDrivePathVariants(
  provider: CloudProvider,
  credentials: ProviderCredentials,
  pathSegments: string[],
  isFolder: boolean
): Promise<NormalizedFile | null> {
  const adapter = getAdapter(provider);
  if (!adapter.getFileByDrivePath) return null;

  for (const variant of generateDrivePathVariants(pathSegments)) {
    try {
      const resolved = await adapter.getFileByDrivePath(credentials, variant);
      if (resolved.isFolder === isFolder) return resolved;
    } catch (error) {
      if (!isProviderItemNotFound(error)) throw error;
    }
  }

  return null;
}

async function resolveParentProviderId(
  supabase: Supabase,
  userId: string,
  parent: FileMetadata,
  credentials: ProviderCredentials,
  provider: CloudProvider
): Promise<string | null> {
  if (await providerItemExists(credentials, provider, parent.provider_file_id)) {
    return parent.provider_file_id;
  }

  const parentSegments = await buildBreadcrumbSegments(supabase, userId, parent);
  const byPath = await tryDrivePathVariants(
    provider,
    credentials,
    parentSegments,
    true
  );
  if (byPath) return byPath.providerFileId;

  if (
    provider === "onedrive" &&
    /rol kamera|camera roll/i.test(parent.name)
  ) {
    const special = await getOneDriveSpecialFolder(credentials, "cameraroll");
    if (special) return special.providerFileId;
  }

  return null;
}

async function findChildInDbParent(
  supabase: Supabase,
  userId: string,
  file: FileMetadata,
  credentials: ProviderCredentials,
  provider: CloudProvider
): Promise<NormalizedFile | null> {
  const adapter = getAdapter(provider);
  if (!adapter.findChildByName) return null;

  if (!file.parent_id) {
    return adapter.findChildByName(credentials, "/", file.name, {
      isFolder: file.is_folder,
      maxPages: MOVE_LIST_MAX_PAGES,
    });
  }

  const parent = await loadFolderMetadata(supabase, userId, file.parent_id);
  if (!parent) return null;

  const parentProviderId = await resolveParentProviderId(
    supabase,
    userId,
    parent,
    credentials,
    provider
  );
  if (!parentProviderId) return null;

  return adapter.findChildByName(
    credentials,
    parentProviderId,
    file.name,
    { isFolder: file.is_folder, maxPages: MOVE_LIST_MAX_PAGES }
  );
}

async function findViaParentPagination(
  provider: CloudProvider,
  credentials: ProviderCredentials,
  pathSegments: string[],
  file: Pick<FileMetadata, "name" | "is_folder">,
  parentProviderId: string | null
): Promise<NormalizedFile | null> {
  const adapter = getAdapter(provider);
  if (!adapter.findChildByName) return null;

  if (parentProviderId) {
    const child = await adapter.findChildByName(
      credentials,
      parentProviderId,
      file.name,
      { isFolder: file.is_folder, maxPages: MOVE_LIST_MAX_PAGES }
    );
    if (child) return child;
  }

  const parentSegments = pathSegments.slice(0, -1);
  if (parentSegments.length === 0) {
    return adapter.findChildByName(credentials, "/", file.name, {
      isFolder: file.is_folder,
      maxPages: MOVE_LIST_MAX_PAGES,
    });
  }

  const parentItem = await tryDrivePathVariants(
    provider,
    credentials,
    parentSegments,
    true
  );
  if (!parentItem) return null;

  return adapter.findChildByName(
    credentials,
    parentItem.providerFileId,
    file.name,
    { isFolder: file.is_folder, maxPages: MOVE_LIST_MAX_PAGES }
  );
}

async function persistResolvedProviderFileId(
  supabase: Supabase,
  userId: string,
  file: FileMetadata,
  resolvedId: string,
  accountId?: string
): Promise<FileMetadata> {
  const updates: Record<string, string> = {
    provider_file_id: resolvedId,
    synced_at: new Date().toISOString(),
  };
  if (accountId && accountId !== file.account_id) {
    updates.account_id = accountId;
  }

  const { data: updated, error } = await supabase
    .from("file_metadata")
    .update(updates)
    .eq("id", file.id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !updated) {
    return {
      ...file,
      provider_file_id: resolvedId,
      account_id: accountId ?? file.account_id,
    };
  }

  return updated as FileMetadata;
}

async function resolveOnProvider(
  supabase: Supabase,
  userId: string,
  file: FileMetadata,
  credentials: ProviderCredentials,
  provider: CloudProvider,
  accountId: string
): Promise<FileMetadata> {
  if (await providerItemExists(credentials, provider, file.provider_file_id)) {
    return file;
  }

  // Prefer listing the DB parent folder (same ID used by browse refresh).
  const byDbParent = await findChildInDbParent(
    supabase,
    userId,
    file,
    credentials,
    provider
  );
  if (byDbParent) {
    return persistResolvedProviderFileId(
      supabase,
      userId,
      file,
      byDbParent.providerFileId,
      accountId
    );
  }

  const pathSegments = await buildBreadcrumbSegments(supabase, userId, file);
  const parentRow = file.parent_id
    ? await loadFolderMetadata(supabase, userId, file.parent_id)
    : null;
  const parentProviderId = parentRow
    ? await resolveParentProviderId(
        supabase,
        userId,
        parentRow,
        credentials,
        provider
      )
    : null;

  const byPath = await tryDrivePathVariants(
    provider,
    credentials,
    pathSegments,
    file.is_folder
  );
  if (byPath) {
    return persistResolvedProviderFileId(
      supabase,
      userId,
      file,
      byPath.providerFileId,
      accountId
    );
  }

  const byParentScan = await findViaParentPagination(
    provider,
    credentials,
    pathSegments,
    file,
    parentProviderId
  );
  if (byParentScan) {
    return persistResolvedProviderFileId(
      supabase,
      userId,
      file,
      byParentScan.providerFileId,
      accountId
    );
  }

  const adapter = getAdapter(provider);
  if (adapter.searchByName) {
    try {
      const results = await adapter.searchByName(credentials, file.name);
      const exactMatches = results.filter(
        (item) => item.name === file.name && item.isFolder === file.is_folder
      );
      if (parentProviderId && exactMatches.length > 1) {
        const inParent = exactMatches.filter(
          (item) => item.parentProviderId === parentProviderId
        );
        if (inParent.length === 1) {
          return persistResolvedProviderFileId(
            supabase,
            userId,
            file,
            inParent[0]!.providerFileId,
            accountId
          );
        }
      }
      if (exactMatches.length === 1) {
        return persistResolvedProviderFileId(
          supabase,
          userId,
          file,
          exactMatches[0]!.providerFileId,
          accountId
        );
      }
    } catch (error) {
      if (!isProviderItemNotFound(error)) throw error;
    }
  }

  const parentLabel = parentRow?.name ?? "folder";
  throw new Error(
    `${providerFileNotFoundMessage(file.name)} (parent: ${parentLabel})`
  );
}

/**
 * Resolve provider file ID for move/download, trying other accounts of the same
 * provider when metadata may point at the wrong cloud account.
 */
export async function resolveFileMetadataForMove(
  supabase: Supabase,
  userId: string,
  file: FileMetadata
): Promise<{
  file: FileMetadata;
  credentials: ProviderCredentials;
  provider: CloudProvider;
}> {
  const { data: accounts, error } = await supabase
    .from("cloud_accounts")
    .select("id, provider")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  const sourceAccount = (accounts ?? []).find((a) => a.id === file.account_id);
  if (!sourceAccount) {
    throw new Error("Cloud account not found");
  }

  const provider = sourceAccount.provider;

  const parentAccountId = file.parent_id
    ? (
        await supabase
          .from("file_metadata")
          .select("account_id")
          .eq("id", file.parent_id)
          .eq("user_id", userId)
          .single()
      ).data?.account_id
    : null;

  const primaryAccountId = parentAccountId ?? file.account_id;

  const candidateIds = [
    primaryAccountId,
    file.account_id,
    ...(accounts ?? [])
      .filter(
        (account) =>
          account.provider === provider &&
          account.id !== primaryAccountId &&
          account.id !== file.account_id
      )
      .map((account) => account.id),
  ];
  const uniqueCandidateIds = [...new Set(candidateIds)];

  let lastError: Error | null = null;

  for (const accountId of uniqueCandidateIds) {
    const account = (accounts ?? []).find((entry) => entry.id === accountId);
    if (!account || account.provider !== provider) continue;

    const { credentials } = await getAccountCredentials(
      supabase,
      accountId,
      userId
    );

    try {
      const resolved = await resolveOnProvider(
        supabase,
        userId,
        file,
        credentials,
        provider,
        accountId
      );
      return { file: resolved, credentials, provider };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (!lastError.message.includes("not found in the cloud")) {
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error(providerFileNotFoundMessage(file.name));
}

/** @deprecated Use resolveFileMetadataForMove for transfers. */
export async function resolveFileMetadataForProvider(
  supabase: Supabase,
  userId: string,
  file: FileMetadata,
  credentials: ProviderCredentials,
  provider: CloudProvider
): Promise<FileMetadata> {
  return resolveOnProvider(
    supabase,
    userId,
    file,
    credentials,
    provider,
    file.account_id
  );
}
