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

function oauthRedirect(
  params: Record<string, string>,
  isPopup: boolean,
  mutate?: (response: NextResponse) => void
) {
  const response = NextResponse.redirect(buildOAuthReturnUrl(params, isPopup));
  mutate?.(response);
  return response;
}

function shortError(err: unknown): string {
  const message = err instanceof Error ? err.message : "connection_failed";
  return message.length > 180 ? `${message.slice(0, 177)}...` : message;
}

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  };
}

/** Wait briefly then re-enter callback to read the exchange result cookie. */
function waitThenFinalize(provider: CloudProvider) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const target = `${appUrl}/api/accounts/${provider}/callback?finalize=1`;
  const html = `<!doctype html><html><body style="font-family:sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center">
<p>Completing connection...</p>
<script>setTimeout(function(){location.replace(${JSON.stringify(target)});},2500);</script>
</body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
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
  const finalize = searchParams.get("finalize") === "1";

  const stateCookie = `oauth_state_${provider}`;
  const resultCookie = `oauth_result_${provider}`;
  const inflightCookie = `oauth_inflight_${provider}`;
  const savedState = cookieStore.get(stateCookie)?.value;
  const priorResult = cookieStore.get(resultCookie)?.value;
  const inflight = cookieStore.get(inflightCookie)?.value === "1";

  if (finalize) {
    if (priorResult?.startsWith("connected:")) {
      return oauthRedirect(
        { connected: priorResult.slice("connected:".length) },
        isPopup,
        (response) => {
          response.cookies.delete("oauth_popup");
          response.cookies.delete(inflightCookie);
          response.cookies.delete(resultCookie);
        }
      );
    }
    if (priorResult?.startsWith("error:")) {
      return oauthRedirect(
        { error: priorResult.slice("error:".length) },
        isPopup,
        (response) => {
          response.cookies.delete("oauth_popup");
          response.cookies.delete(inflightCookie);
          response.cookies.delete(resultCookie);
        }
      );
    }
    if (inflight) {
      return waitThenFinalize(provider);
    }
    return oauthRedirect({ error: "connection_failed" }, isPopup, (response) => {
      response.cookies.delete("oauth_popup");
    });
  }

  // Microsoft personal accounts often send a second callback with
  // error=server_error while/after the real code exchange runs.
  if (error || !code || !state) {
    if (priorResult?.startsWith("connected:")) {
      return oauthRedirect(
        { connected: priorResult.slice("connected:".length) },
        isPopup,
        (response) => {
          response.cookies.delete("oauth_popup");
          response.cookies.delete(inflightCookie);
        }
      );
    }

    if (priorResult?.startsWith("error:")) {
      return oauthRedirect(
        { error: priorResult.slice("error:".length) },
        isPopup,
        (response) => {
          response.cookies.delete("oauth_popup");
          response.cookies.delete(inflightCookie);
        }
      );
    }

    if (inflight || (error && state && savedState === state)) {
      console.warn(
        `[oauth:${provider}] Ignoring noisy callback error=${error ?? "missing_code"}`
      );
      return waitThenFinalize(provider);
    }

    if (error && state && !savedState) {
      console.warn(
        `[oauth:${provider}] Ignoring duplicate callback error=${error}`
      );
      return waitThenFinalize(provider);
    }

    return oauthRedirect({ error: "oauth_denied" }, isPopup, (response) => {
      response.cookies.delete("oauth_popup");
      response.cookies.delete(stateCookie);
      response.cookies.delete(inflightCookie);
    });
  }

  if (!savedState || savedState !== state) {
    if (priorResult?.startsWith("connected:")) {
      return oauthRedirect(
        { connected: priorResult.slice("connected:".length) },
        isPopup
      );
    }
    return oauthRedirect({ error: "invalid_state" }, isPopup, (response) => {
      response.cookies.delete("oauth_popup");
      response.cookies.delete(stateCookie);
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/login`);
  }

  // Consume state immediately so a parallel error callback cannot deny the flow,
  // and mark exchange as in-flight for the wait page above.
  cookieStore.delete(stateCookie);
  cookieStore.set(inflightCookie, "1", cookieOpts(120));

  try {
    const oauthConfig = await resolveOAuthConfig(provider);
    if (!oauthConfig) {
      return oauthRedirect(
        { error: "provider_not_configured", provider },
        isPopup,
        (response) => {
          response.cookies.delete("oauth_popup");
          response.cookies.delete(inflightCookie);
          response.cookies.set(
            resultCookie,
            "error:provider_not_configured",
            cookieOpts(120)
          );
        }
      );
    }

    const adapter = getAdapter(provider);
    const credentials = await adapter.exchangeCode(code, oauthConfig);
    const account = await saveAccount(supabase, user.id, provider, credentials);

    syncUserAccounts(supabase, user.id, account.id).catch(() => {});

    return oauthRedirect({ connected: provider }, isPopup, (response) => {
      response.cookies.delete("oauth_popup");
      response.cookies.delete(inflightCookie);
      response.cookies.set(
        resultCookie,
        `connected:${provider}`,
        cookieOpts(120)
      );
    });
  } catch (err) {
    console.error(`[oauth:${provider}] Connect failed:`, err);
    const message = shortError(err);
    return oauthRedirect({ error: message }, isPopup, (response) => {
      response.cookies.delete("oauth_popup");
      response.cookies.delete(inflightCookie);
      response.cookies.set(resultCookie, `error:${message}`, cookieOpts(120));
    });
  }
}
