import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccountCredentials } from "@/lib/services/accounts";
import { getAdapter } from "@/lib/adapters/registry";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: file, error: fileError } = await supabase
    .from("file_metadata")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fileError || !file || file.is_folder) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const { account, credentials } = await getAccountCredentials(
    supabase,
    file.account_id,
    user.id
  );
  const adapter = getAdapter(account.provider);
  const { stream, mimeType, name } = await adapter.download(
    credentials,
    file.provider_file_id
  );

  return new NextResponse(stream, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(name)}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
