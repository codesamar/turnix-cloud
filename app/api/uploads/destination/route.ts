import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { peekUploadAccount } from "@/lib/services/allocation";
import { PROVIDER_LABELS } from "@/lib/adapters/config";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parentPath = searchParams.get("parentPath") ?? "/";
  const folderName = searchParams.get("folderName");

  try {
    const { account, strategy } = await peekUploadAccount(supabase, user.id);

    return NextResponse.json({
      destination: {
        account: {
          id: account.id,
          label: account.label,
          email: account.email,
          provider: account.provider,
          providerLabel: PROVIDER_LABELS[account.provider],
        },
        folderName: folderName || null,
        parentPath,
        isRoot: parentPath === "/",
        strategy,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No upload destination" },
      { status: 400 }
    );
  }
}
