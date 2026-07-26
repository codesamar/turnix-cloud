import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildTeraboxCredentials } from "@/lib/adapters/terabox-client";
import { saveAccount } from "@/lib/services/accounts";
import { syncUserAccounts } from "@/lib/services/sync";
import { withTimeout } from "@/lib/utils/with-timeout";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { ndusToken, baseUrl, label } = body;

  if (!ndusToken || typeof ndusToken !== "string") {
    return NextResponse.json({ error: "NDUS token is required" }, { status: 400 });
  }

  try {
    // Validate session + save only. Full sync runs in background so the UI
    // does not stay on "Connecting..." while TeraBox lists thousands of files.
    const credentials = await withTimeout(
      buildTeraboxCredentials({ ndusToken, baseUrl }),
      25_000,
      "TeraBox did not respond in time. Check the NDUS token and try again."
    );

    const account = await saveAccount(
      supabase,
      user.id,
      "terabox",
      credentials,
      label ?? credentials.email ?? "TeraBox"
    );

    syncUserAccounts(supabase, user.id, account.id).catch((error) => {
      console.error("[terabox:connect] background sync failed", error);
    });

    return NextResponse.json({
      account,
      syncStarted: true,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Connection failed" },
      { status: 400 }
    );
  }
}
