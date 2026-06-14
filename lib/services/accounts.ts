import type { SupabaseClient } from "@supabase/supabase-js";
import type { CloudAccount, CloudProvider } from "@/lib/types/database";
import type { ProviderCredentials } from "@/lib/adapters/types";
import { getAdapter } from "@/lib/adapters/registry";
import {
  decryptCredentials,
  encryptCredentials,
} from "@/lib/services/crypto";

type Supabase = SupabaseClient;

export async function getAccountCredentials(
  supabase: Supabase,
  accountId: string,
  userId: string
): Promise<{ account: CloudAccount; credentials: ProviderCredentials }> {
  const { data: account, error } = await supabase
    .from("cloud_accounts")
    .select("*")
    .eq("id", accountId)
    .eq("user_id", userId)
    .single();

  if (error || !account) {
    throw new Error("Cloud account not found");
  }

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
      .eq("id", accountId);
  }

  return { account, credentials };
}

export async function saveAccount(
  supabase: Supabase,
  userId: string,
  provider: CloudProvider,
  credentials: ProviderCredentials,
  label?: string
): Promise<CloudAccount> {
  const adapter = getAdapter(provider);
  const quota = await adapter.getQuota(credentials);

  const { data, error } = await supabase
    .from("cloud_accounts")
    .upsert(
      {
        user_id: userId,
        provider,
        label: label ?? credentials.email ?? provider,
        email: credentials.email ?? null,
        quota_used: quota.used,
        quota_total: quota.total,
        credentials_encrypted: encryptCredentials(credentials),
        status: "active" as const,
      },
      { onConflict: "user_id,provider,email" }
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save account");
  }

  return data;
}

export async function listAccounts(supabase: Supabase, userId: string) {
  const { data, error } = await supabase
    .from("cloud_accounts")
    .select("id, provider, label, email, quota_used, quota_total, status, last_synced_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
