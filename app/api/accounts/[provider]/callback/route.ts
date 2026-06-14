import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { CloudProvider } from "@/lib/types/database";
import { getAdapter } from "@/lib/adapters/registry";
import { saveAccount } from "@/lib/services/accounts";
import { createClient } from "@/lib/supabase/server";
import { syncUserAccounts } from "@/lib/services/sync";
import { buildOAuthReturnUrl } from "@/lib/oauth/popup";
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

function oauthRedirect(params: Record<string, string>, isPopup: boolean) {
  return NextResponse.redirect(buildOAuthReturnUrl(params, isPopup));
}

export async function GET(request: Request, { params }: RouteParams) {
  const { provider: providerParam } = await params;
  const provider = PROVIDER_PARAM_MAP[providerParam];

  const cookieStore = await cookies();
  const isPopup = cookieStore.get("oauth_popup")?.value === "1";

  if (!provider) {
    return oauthRedirect({ error: "invalid_provider" }, isPopup);
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state) {
    cookieStore.delete("oauth_popup");
    return oauthRedirect({ error: "oauth_denied" }, isPopup);
  }

  const savedState = cookieStore.get(`oauth_state_${provider}`)?.value;

  if (!savedState || savedState !== state) {
    cookieStore.delete("oauth_popup");
    return oauthRedirect({ error: "invalid_state" }, isPopup);
  }

  cookieStore.delete(`oauth_state_${provider}`);
  cookieStore.delete("oauth_popup");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/login`);
  }

  try {
    const oauthConfig = await resolveOAuthConfig(provider);
    if (!oauthConfig) {
      return oauthRedirect(
        { error: "provider_not_configured", provider },
        isPopup
      );
    }

    const adapter = getAdapter(provider);
    const credentials = await adapter.exchangeCode(code, oauthConfig);
    const account = await saveAccount(supabase, user.id, provider, credentials);

    syncUserAccounts(supabase, user.id, account.id).catch(() => {});

    return oauthRedirect({ connected: provider }, isPopup);
  } catch (err) {
    const message = err instanceof Error ? err.message : "connection_failed";
    return oauthRedirect({ error: message }, isPopup);
  }
}
