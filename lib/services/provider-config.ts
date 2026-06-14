import type { CloudProvider } from "@/lib/types/database";
import type { OAuthProviderConfig } from "@/lib/adapters/types";
import { getAppUrl, OAUTH_PROVIDERS } from "@/lib/adapters/config";
import {
  decryptCredentials,
  encryptCredentials,
} from "@/lib/services/crypto";
import { createClient } from "@/lib/supabase/server";

export interface ProviderConfigRow {
  provider: CloudProvider;
  enabled: boolean;
  client_id: string | null;
  client_secret_encrypted: string;
  extra: Record<string, string>;
  updated_at: string;
  has_secret: boolean;
}

export interface ProviderStatus {
  provider: CloudProvider;
  enabled: boolean;
  configured: boolean;
  redirectUri: string;
  clientId: string | null;
  extra: Record<string, string>;
  authType: "oauth" | "credentials";
}

interface StoredProviderSecret {
  clientSecret?: string;
}

const ENV_MAP: Record<
  CloudProvider,
  { clientId?: string; clientSecret?: string; extra?: Record<string, string> }
> = {
  google_drive: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  onedrive: {
    clientId: process.env.ONEDRIVE_CLIENT_ID,
    clientSecret: process.env.ONEDRIVE_CLIENT_SECRET,
    extra: { tenantId: process.env.ONEDRIVE_TENANT_ID ?? "common" },
  },
  dropbox: {
    clientId: process.env.DROPBOX_CLIENT_ID,
    clientSecret: process.env.DROPBOX_CLIENT_SECRET,
  },
  yandex: {
    clientId: process.env.YANDEX_CLIENT_ID,
    clientSecret: process.env.YANDEX_CLIENT_SECRET,
  },
  mega: {},
  pcloud: {},
  s3: {},
};

export function getProviderRedirectUri(provider: CloudProvider): string {
  return `${getAppUrl()}/api/accounts/${provider}/callback`;
}

function getEnvOAuthConfig(provider: CloudProvider): OAuthProviderConfig | null {
  const env = ENV_MAP[provider];
  if (!env?.clientId || !env?.clientSecret) return null;
  return {
    clientId: env.clientId,
    clientSecret: env.clientSecret,
    redirectUri: getProviderRedirectUri(provider),
    extra: env.extra,
  };
}

function rowToOAuthConfig(
  provider: CloudProvider,
  row: {
    client_id: string | null;
    client_secret_encrypted: string;
    extra: Record<string, string> | null;
    enabled: boolean;
  }
): OAuthProviderConfig | null {
  if (!row.enabled || !row.client_id || !row.client_secret_encrypted) return null;

  try {
    const secret = decryptCredentials<StoredProviderSecret>(
      row.client_secret_encrypted
    );
    if (!secret.clientSecret) return null;
    return {
      clientId: row.client_id,
      clientSecret: secret.clientSecret,
      redirectUri: getProviderRedirectUri(provider),
      extra: row.extra ?? {},
    };
  } catch {
    return null;
  }
}

export async function resolveOAuthConfig(
  provider: CloudProvider
): Promise<OAuthProviderConfig | null> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("provider_config")
    .select("*")
    .eq("provider", provider)
    .maybeSingle();

  if (row) {
    const fromDb = rowToOAuthConfig(provider, {
      client_id: row.client_id,
      client_secret_encrypted: row.client_secret_encrypted,
      extra: row.extra as Record<string, string>,
      enabled: row.enabled,
    });
    if (fromDb) return fromDb;
  }

  return getEnvOAuthConfig(provider);
}

export async function listProviderStatuses(): Promise<ProviderStatus[]> {
  const supabase = await createClient();
  const { data: rows } = await supabase.from("provider_config").select("*");

  const rowMap = new Map((rows ?? []).map((row) => [row.provider, row]));
  const allProviders: CloudProvider[] = [
    "google_drive",
    "onedrive",
    "dropbox",
    "yandex",
    "mega",
    "pcloud",
    "s3",
  ];

  return allProviders.map((provider) => {
    const row = rowMap.get(provider);
    const redirectUri = getProviderRedirectUri(provider);
    const envConfig = getEnvOAuthConfig(provider);
    const dbConfigured = Boolean(
      row?.enabled && row.client_id && row.client_secret_encrypted
    );
    const envConfigured = Boolean(envConfig);
    const authType: ProviderStatus["authType"] = OAUTH_PROVIDERS.includes(provider)
      ? "oauth"
      : "credentials";

    return {
      provider,
      enabled: row?.enabled ?? envConfigured,
      configured: dbConfigured || envConfigured || provider === "s3",
      redirectUri,
      clientId: row?.client_id ?? envConfig?.clientId ?? null,
      extra: (row?.extra as Record<string, string>) ?? envConfig?.extra ?? {},
      authType,
    };
  });
}

export async function saveProviderConfig(
  userId: string,
  provider: CloudProvider,
  input: {
    enabled: boolean;
    clientId?: string;
    clientSecret?: string;
    extra?: Record<string, string>;
  }
) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("provider_config")
    .select("*")
    .eq("provider", provider)
    .maybeSingle();

  let clientSecretEncrypted = existing?.client_secret_encrypted ?? "";

  if (input.clientSecret) {
    clientSecretEncrypted = encryptCredentials({
      clientSecret: input.clientSecret,
    });
  }

  if (input.enabled && !input.clientId && !existing?.client_id) {
    throw new Error("Client ID is required");
  }

  if (input.enabled && !clientSecretEncrypted) {
    throw new Error("Client secret is required");
  }

  const payload = {
    provider,
    enabled: input.enabled,
    client_id: input.clientId ?? existing?.client_id ?? null,
    client_secret_encrypted: clientSecretEncrypted,
    extra: input.extra ?? existing?.extra ?? {},
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("provider_config")
    .upsert(payload, { onConflict: "provider" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save provider config");
  }

  return sanitizeProviderRow(data);
}

export function sanitizeProviderRow(row: {
  provider: CloudProvider;
  enabled: boolean;
  client_id: string | null;
  client_secret_encrypted: string;
  extra: Record<string, string> | null;
  updated_at: string;
}): ProviderConfigRow {
  return {
    provider: row.provider,
    enabled: row.enabled,
    client_id: row.client_id,
    client_secret_encrypted: "",
    extra: row.extra ?? {},
    updated_at: row.updated_at,
    has_secret: Boolean(row.client_secret_encrypted),
  };
}
