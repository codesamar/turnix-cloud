import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildTeraboxCredentials } from "@/lib/adapters/terabox-client";
import { saveAccount } from "@/lib/services/accounts";
import { syncUserAccounts } from "@/lib/services/sync";

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
    const credentials = await buildTeraboxCredentials({ ndusToken, baseUrl });
    const account = await saveAccount(
      supabase,
      user.id,
      "terabox",
      credentials,
      label ?? credentials.email ?? "TeraBox"
    );

    const syncResults = await syncUserAccounts(supabase, user.id, account.id);
    const syncError = syncResults[0]?.error;

    return NextResponse.json({ account, syncResults, syncError });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Connection failed" },
      { status: 400 }
    );
  }
}
