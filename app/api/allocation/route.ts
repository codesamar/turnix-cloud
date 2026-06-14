import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAllocationConfig,
  updateAllocationConfig,
} from "@/lib/services/allocation";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await getAllocationConfig(supabase, user.id);
  return NextResponse.json({ allocation: config });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const config = await updateAllocationConfig(supabase, user.id, {
    strategy: body.strategy,
    weights: body.weights,
    manual_order: body.manual_order,
  });

  return NextResponse.json({ allocation: config });
}
