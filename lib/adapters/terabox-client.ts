import type { ProviderCredentials } from "@/lib/adapters/types";
import type { TeraBoxApp } from "terabox-api";

export interface TeraboxSessionExtra {
  ndusToken: string;
  baseUrl?: string;
  apiHost?: string;
}

export const DEFAULT_TERABOX_BASE_URL = "https://www.terabox.com";

export function parseNdusToken(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/(?:^|;\s*)ndus=([^;]+)/i);
  if (match) return match[1].trim();
  return trimmed;
}

export async function createTeraboxApp(
  credentials: ProviderCredentials
): Promise<TeraBoxApp> {
  const extra = credentials.extra as TeraboxSessionExtra | undefined;
  const ndusToken = parseNdusToken(extra?.ndusToken ?? credentials.accessToken);

  if (!ndusToken) {
    throw new Error("NDUS token is required");
  }

  const { TeraBoxApp } = await import("terabox-api");
  const app = new TeraBoxApp(ndusToken);

  const savedHost = extra?.apiHost?.trim() || extra?.baseUrl?.trim();
  if (savedHost) {
    app.params.whost = savedHost.replace(/\/$/, "");
  }

  await app.updateAppData();
  const login = await app.checkLogin();

  if (login.errno !== 0) {
    throw new Error("TeraBox session is invalid or expired");
  }

  return app;
}

export function getTeraboxApiHost(app: TeraBoxApp): string {
  return app.params.whost;
}

export async function buildTeraboxCredentials(input: {
  ndusToken: string;
  baseUrl?: string;
}): Promise<ProviderCredentials> {
  const ndusToken = parseNdusToken(input.ndusToken);
  const credentials: ProviderCredentials = {
    accessToken: ndusToken,
    extra: {
      ndusToken,
      baseUrl: input.baseUrl?.trim() || DEFAULT_TERABOX_BASE_URL,
    },
  };

  const app = await createTeraboxApp(credentials);
  const login = await app.checkLogin();

  let email = `user-${login.uk}`;
  try {
    const info = await app.getUserInfo(login.uk);
    if (info.records?.[0]?.uname) {
      email = info.records[0].uname;
    }
  } catch {
    // keep fallback email
  }

  return {
    ...credentials,
    extra: {
      ndusToken,
      baseUrl: input.baseUrl?.trim() || DEFAULT_TERABOX_BASE_URL,
      apiHost: getTeraboxApiHost(app),
    },
    email,
    accountId: String(login.uk),
  };
}
