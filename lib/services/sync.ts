import type { SupabaseClient } from "@supabase/supabase-js";
import type { CloudAccount } from "@/lib/types/database";
import { getAdapter } from "@/lib/adapters/registry";
import {
  getOneDriveSpecialFolder,
  type OneDriveSpecialFolderName,
} from "@/lib/adapters/onedrive";
import {
  decryptCredentials,
  encryptCredentials,
} from "@/lib/services/crypto";
import type {
  NormalizedFile,
  ProviderCredentials,
} from "@/lib/adapters/types";
import { OAUTH_PROVIDERS } from "@/lib/adapters/config";
import { resolveOAuthConfig } from "@/lib/services/provider-config";
import { classifyAccountError } from "@/lib/utils/account-error";

type Supabase = SupabaseClient;

interface SyncResult {
  accountId: string;
  provider: string;
  filesSynced: number;
  error?: string;
}

const ONEDRIVE_SPECIAL_FOLDERS: OneDriveSpecialFolderName[] = [
  "photos",
  "cameraroll",
];

async function getValidCredentials(
  supabase: Supabase,
  account: CloudAccount
): Promise<ProviderCredentials> {
  let credentials = decryptCredentials<ProviderCredentials>(
    account.credentials_encrypted
  );
  const adapter = getAdapter(account.provider);
  if (credentials.expiresAt && credentials.expiresAt < Date.now() + 60_000) {
    const oauthConfig = OAUTH_PROVIDERS.includes(account.provider)
      ? await resolveOAuthConfig(account.provider)
      : null;
    credentials = await adapter.refreshToken(credentials, oauthConfig ?? undefined);
    await supabase
      .from("cloud_accounts")
      .update({
        credentials_encrypted: encryptCredentials(credentials),
        status: "active",
      })
      .eq("id", account.id);
  }
  return credentials;
}

async function upsertFileRow(
  supabase: Supabase,
  userId: string,
  accountId: string,
  file: NormalizedFile,
  parentId: string | null
): Promise<string | null> {
  const { data: upserted } = await supabase
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

  return upserted?.id ?? null;
}

async function syncAccountPath(
  supabase: Supabase,
  userId: string,
  accountId: string,
  provider: CloudAccount["provider"],
  credentials: ProviderCredentials,
  path: string,
  parentId: string | null = null
): Promise<number> {
  const adapter = getAdapter(provider);
  const files = await adapter.listFiles(credentials, path);
  let count = 0;

  for (const file of files) {
    const upsertedId = await upsertFileRow(
      supabase,
      userId,
      accountId,
      file,
      parentId
    );
    count++;

    if (file.isFolder && upsertedId) {
      count += await syncAccountPath(
        supabase,
        userId,
        accountId,
        provider,
        credentials,
        file.providerFileId,
        upsertedId
      );
    }
  }

  return count;
}

/**
 * Sync OneDrive Photos / Camera Roll special folders into the account root
 * in My Drive. Missing folders (404/403) are skipped. Upsert on
 * (account_id, provider_file_id) dedupes if the same folder already appeared
 * under root children.
 */
async function syncOneDriveSpecialFolders(
  supabase: Supabase,
  userId: string,
  accountId: string,
  credentials: ProviderCredentials
): Promise<number> {
  let count = 0;

  for (const name of ONEDRIVE_SPECIAL_FOLDERS) {
    const folder = await getOneDriveSpecialFolder(credentials, name);
    if (!folder) continue;

    const folderId = await upsertFileRow(
      supabase,
      userId,
      accountId,
      folder,
      null
    );
    count++;

    if (folderId) {
      count += await syncAccountPath(
        supabase,
        userId,
        accountId,
        "onedrive",
        credentials,
        folder.providerFileId,
        folderId
      );
    }
  }

  return count;
}

export async function syncUserAccounts(
  supabase: Supabase,
  userId: string,
  accountId?: string
): Promise<SyncResult[]> {
  let query = supabase
    .from("cloud_accounts")
    .select("*")
    .eq("user_id", userId);

  if (accountId) {
    query = query.eq("id", accountId);
  } else {
    // Sync All skips accounts already in error — they need reconnect first
    query = query.eq("status", "active");
  }

  const { data: accounts, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const results: SyncResult[] = [];

  for (const account of accounts ?? []) {
    try {
      const credentials = await getValidCredentials(supabase, account);
      const adapter = getAdapter(account.provider);
      const quota = await adapter.getQuota(credentials);

      let filesSynced = await syncAccountPath(
        supabase,
        userId,
        account.id,
        account.provider,
        credentials,
        "/"
      );

      if (account.provider === "onedrive") {
        filesSynced += await syncOneDriveSpecialFolders(
          supabase,
          userId,
          account.id,
          credentials
        );
      }

      await supabase
        .from("cloud_accounts")
        .update({
          quota_used: quota.used,
          quota_total: quota.total,
          last_synced_at: new Date().toISOString(),
          status: "active",
          error_message: null,
        })
        .eq("id", account.id);

      results.push({
        accountId: account.id,
        provider: account.provider,
        filesSynced,
      });
    } catch (err) {
      const errorMessage = classifyAccountError(err);
      await supabase
        .from("cloud_accounts")
        .update({ status: "error", error_message: errorMessage })
        .eq("id", account.id);

      results.push({
        accountId: account.id,
        provider: account.provider,
        filesSynced: 0,
        error: errorMessage,
      });
    }
  }

  return results;
}
