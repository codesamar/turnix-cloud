import type { SupabaseClient } from "@supabase/supabase-js";
import type { CloudAccount } from "@/lib/types/database";
import { getAdapter } from "@/lib/adapters/registry";
import {
  decryptCredentials,
  encryptCredentials,
} from "@/lib/services/crypto";
import type { ProviderCredentials } from "@/lib/adapters/types";

type Supabase = SupabaseClient;

interface SyncResult {
  accountId: string;
  provider: string;
  filesSynced: number;
  error?: string;
}

async function getValidCredentials(
  supabase: Supabase,
  account: CloudAccount
): Promise<ProviderCredentials> {
  let credentials = decryptCredentials<ProviderCredentials>(
    account.credentials_encrypted
  );
  const adapter = getAdapter(account.provider);
  if (credentials.expiresAt && credentials.expiresAt < Date.now() + 60_000) {
    credentials = await adapter.refreshToken(credentials);
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

    count++;

    if (file.isFolder && upserted) {
      count += await syncAccountPath(
        supabase,
        userId,
        accountId,
        provider,
        credentials,
        file.providerFileId,
        upserted.id
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
    .eq("user_id", userId)
    .eq("status", "active");

  if (accountId) {
    query = query.eq("id", accountId);
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

      const filesSynced = await syncAccountPath(
        supabase,
        userId,
        account.id,
        account.provider,
        credentials,
        "/"
      );

      await supabase
        .from("cloud_accounts")
        .update({
          quota_used: quota.used,
          quota_total: quota.total,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", account.id);

      results.push({
        accountId: account.id,
        provider: account.provider,
        filesSynced,
      });
    } catch (err) {
      await supabase
        .from("cloud_accounts")
        .update({ status: "error" })
        .eq("id", account.id);

      results.push({
        accountId: account.id,
        provider: account.provider,
        filesSynced: 0,
        error: err instanceof Error ? err.message : "Sync failed",
      });
    }
  }

  return results;
}

export async function syncAllUsers(supabase: Supabase): Promise<SyncResult[]> {
  const { data: accounts, error } = await supabase
    .from("cloud_accounts")
    .select("user_id")
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  const userIds = [...new Set((accounts ?? []).map((a) => a.user_id))];
  const allResults: SyncResult[] = [];

  for (const userId of userIds) {
    const results = await syncUserAccounts(supabase, userId);
    allResults.push(...results);
  }

  return allResults;
}
