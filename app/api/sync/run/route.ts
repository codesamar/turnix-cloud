import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncUserAccounts } from "@/lib/services/sync";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const accountId = body.accountId as string | undefined;

  const results = await syncUserAccounts(supabase, user.id, accountId);
  return NextResponse.json({ results });
}
