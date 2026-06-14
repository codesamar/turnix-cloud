import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listProviderStatuses } from "@/lib/services/provider-config";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const providers = await listProviderStatuses();
  return NextResponse.json({ providers });
}
