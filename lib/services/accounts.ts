import type { SupabaseClient } from "@supabase/supabase-js";
import type { CloudAccount, CloudProvider } from "@/lib/types/database";
import type { ProviderCredentials } from "@/lib/adapters/types";
import { getAdapter } from "@/lib/adapters/registry";
import { OAUTH_PROVIDERS, PROVIDER_LABELS } from "@/lib/adapters/config";
import {
  decryptCredentials,
  encryptCredentials,
} from "@/lib/services/crypto";
import { resolveOAuthConfig } from "@/lib/services/provider-config";
import {
  AccountDisconnectedError,
  classifyAccountError,
  isTokenExpiredError,
} from "@/lib/utils/account-error";

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

  const cloudAccount = account as CloudAccount;
  const accountLabel =
    cloudAccount.email ||
    cloudAccount.label ||
    PROVIDER_LABELS[cloudAccount.provider];

  if (
    cloudAccount.status === "error" &&
    isTokenExpiredError(cloudAccount.error_message)
  ) {
    throw new AccountDisconnectedError(accountLabel);
  }

  let credentials = decryptCredentials<ProviderCredentials>(
    cloudAccount.credentials_encrypted
  );

  const adapter = getAdapter(cloudAccount.provider);
  if (credentials.expiresAt && credentials.expiresAt < Date.now() + 60_000) {
    try {
      const oauthConfig = OAUTH_PROVIDERS.includes(cloudAccount.provider)
        ? await resolveOAuthConfig(cloudAccount.provider)
        : null;
      if (OAUTH_PROVIDERS.includes(cloudAccount.provider) && !oauthConfig) {
        throw new Error(
          `${PROVIDER_LABELS[cloudAccount.provider]} OAuth is not configured`
        );
      }
      credentials = await adapter.refreshToken(
        credentials,
        oauthConfig ?? undefined
      );
      await supabase
        .from("cloud_accounts")
        .update({
          credentials_encrypted: encryptCredentials(credentials),
          status: "active",
          error_message: null,
        })
        .eq("id", accountId);
    } catch (err) {
      const errorMessage = classifyAccountError(err);
      await supabase
        .from("cloud_accounts")
        .update({ status: "error", error_message: errorMessage })
        .eq("id", accountId);

      if (isTokenExpiredError(errorMessage)) {
        throw new AccountDisconnectedError(accountLabel);
      }
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  return { account: cloudAccount, credentials };
}

export async function saveAccount(
  supabase: Supabase,
  userId: string,
  provider: CloudProvider,
  credentials: ProviderCredentials,
  label?: string
): Promise<CloudAccount> {
  // Providers may omit refresh_token on reconnect — keep the previous one.
  let credentialsToSave = credentials;
  if (!credentials.refreshToken && credentials.email) {
    const { data: existing } = await supabase
      .from("cloud_accounts")
      .select("credentials_encrypted")
      .eq("user_id", userId)
      .eq("provider", provider)
      .eq("email", credentials.email)
      .maybeSingle();

    if (existing?.credentials_encrypted) {
      const previous = decryptCredentials<ProviderCredentials>(
        existing.credentials_encrypted
      );
      if (previous.refreshToken) {
        credentialsToSave = {
          ...credentials,
          refreshToken: previous.refreshToken,
        };
      }
    }
  }

  const adapter = getAdapter(provider);
  const quota = await adapter.getQuota(credentialsToSave);

  const { data, error } = await supabase
    .from("cloud_accounts")
    .upsert(
      {
        user_id: userId,
        provider,
        label: label ?? credentialsToSave.email ?? provider,
        email: credentialsToSave.email ?? null,
        quota_used: quota.used,
        quota_total: quota.total,
        credentials_encrypted: encryptCredentials(credentialsToSave),
        status: "active" as const,
        error_message: null,
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
    .select(
      "id, provider, label, email, quota_used, quota_total, status, error_message, last_synced_at, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
