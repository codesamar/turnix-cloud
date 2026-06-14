import { NextResponse } from "next/server";
import type { CloudProvider } from "@/lib/types/database";
import { OAUTH_PROVIDERS, PROVIDER_LABELS } from "@/lib/adapters/config";
import { createClient } from "@/lib/supabase/server";
import { saveProviderConfig } from "@/lib/services/provider-config";

const PROVIDER_PARAM_MAP: Record<string, CloudProvider> = {
  google_drive: "google_drive",
  onedrive: "onedrive",
  dropbox: "dropbox",
  yandex: "yandex",
  s3: "s3",
  mega: "mega",
  pcloud: "pcloud",
};

interface RouteParams {
  params: Promise<{ provider: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { provider: providerParam } = await params;
  const provider = PROVIDER_PARAM_MAP[providerParam];

  if (!provider || !OAUTH_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: "Invalid OAuth provider" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  try {
    const config = await saveProviderConfig(user.id, provider, {
      enabled: Boolean(body.enabled),
      clientId: body.clientId,
      clientSecret: body.clientSecret,
      extra: body.extra,
    });

    return NextResponse.json({
      provider: config.provider,
      label: PROVIDER_LABELS[provider],
      enabled: config.enabled,
      clientId: config.client_id,
      hasSecret: config.has_secret,
      extra: config.extra,
      updatedAt: config.updated_at,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save config" },
      { status: 400 }
    );
  }
}
