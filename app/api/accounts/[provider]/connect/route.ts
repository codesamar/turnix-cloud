import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { CloudProvider } from "@/lib/types/database";
import { getAdapter } from "@/lib/adapters/registry";
import { OAUTH_PROVIDERS } from "@/lib/adapters/config";
import { resolveOAuthConfig } from "@/lib/services/provider-config";

const PROVIDER_PARAM_MAP: Record<string, CloudProvider> = {
  google_drive: "google_drive",
  onedrive: "onedrive",
  dropbox: "dropbox",
  yandex: "yandex",
};

interface RouteParams {
  params: Promise<{ provider: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { provider: providerParam } = await params;
  const provider = PROVIDER_PARAM_MAP[providerParam];

  if (!provider || !OAUTH_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  const oauthConfig = await resolveOAuthConfig(provider);
  if (!oauthConfig) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(
      `${appUrl}/quota?error=provider_not_configured&provider=${provider}`
    );
  }

  const adapter = getAdapter(provider);
  const state = crypto.randomUUID();

  const cookieStore = await cookies();
  cookieStore.set(`oauth_state_${provider}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const authUrl = adapter.getAuthUrl(state, oauthConfig);
  return NextResponse.redirect(authUrl);
}
