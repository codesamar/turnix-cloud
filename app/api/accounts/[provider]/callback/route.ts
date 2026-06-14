import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { CloudProvider } from "@/lib/types/database";
import { getAdapter } from "@/lib/adapters/registry";
import { saveAccount } from "@/lib/services/accounts";
import { createClient } from "@/lib/supabase/server";
import { syncUserAccounts } from "@/lib/services/sync";

const PROVIDER_PARAM_MAP: Record<string, CloudProvider> = {
  google_drive: "google_drive",
  onedrive: "onedrive",
  dropbox: "dropbox",
  yandex: "yandex",
};

interface RouteParams {
  params: Promise<{ provider: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { provider: providerParam } = await params;
  const provider = PROVIDER_PARAM_MAP[providerParam];

  if (!provider) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/quota?error=invalid_provider`
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/quota?error=oauth_denied`
    );
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get(`oauth_state_${provider}`)?.value;

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/quota?error=invalid_state`
    );
  }

  cookieStore.delete(`oauth_state_${provider}`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login`
    );
  }

  try {
    const adapter = getAdapter(provider);
    const credentials = await adapter.exchangeCode(code);
    const account = await saveAccount(supabase, user.id, provider, credentials);

    syncUserAccounts(supabase, user.id, account.id).catch(() => {});

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/quota?connected=${provider}`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "connection_failed";
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/quota?error=${encodeURIComponent(message)}`
    );
  }
}
