import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncUserAccounts, syncAllUsers } from "@/lib/services/sync";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = request.headers.get("x-cron-secret");
  const isCron =
    (cronSecret && cronSecret === process.env.CRON_SECRET) ||
    authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (isCron) {
    const supabase = await createServiceClient();
    const results = await syncAllUsers(supabase);
    return NextResponse.json({ results });
  }

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
