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

  const { data: file } = await supabase
    .from("file_metadata")
    .select("*, cloud_accounts(provider, label)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return NextResponse.json({ file });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (body.action === "rename" && body.name) {
    const { data: file } = await supabase
      .from("file_metadata")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const { account, credentials } = await getAccountCredentials(
      supabase,
      file.account_id,
      user.id
    );
    const adapter = getAdapter(account.provider);
    await adapter.rename(credentials, file.provider_file_id, body.name);

    const { data: updated } = await supabase
      .from("file_metadata")
      .update({ name: body.name })
      .eq("id", id)
      .select()
      .single();

    return NextResponse.json({ file: updated });
  }

  if (body.action === "star") {
    const { data: updated } = await supabase
      .from("file_metadata")
      .update({ is_starred: Boolean(body.starred) })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    return NextResponse.json({ file: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: file } = await supabase
    .from("file_metadata")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const { account, credentials } = await getAccountCredentials(
    supabase,
    file.account_id,
    user.id
  );
  const adapter = getAdapter(account.provider);
  await adapter.deleteFile(credentials, file.provider_file_id);
  await supabase.from("file_metadata").delete().eq("id", id);

  return NextResponse.json({ success: true });
}
