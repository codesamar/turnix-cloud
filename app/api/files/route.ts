import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccountCredentials } from "@/lib/services/accounts";
import { moveFiles } from "@/lib/services/move";
import { getAdapter } from "@/lib/adapters/registry";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  const parentId = searchParams.get("parentId");
  const recent = searchParams.get("recent");
  const starred = searchParams.get("starred");
  const shared = searchParams.get("shared");
  const accountId = searchParams.get("accountId");

  let query = supabase
    .from("file_metadata")
    .select("*, cloud_accounts(provider, label, email)")
    .eq("user_id", user.id);

  if (recent) {
    query = query.order("modified_at", { ascending: false }).limit(50);
  } else if (starred) {
    query = query.eq("is_starred", true).order("name");
  } else if (shared) {
    query = query.eq("is_shared", true).order("modified_at", { ascending: false });
  } else if (parentId) {
    query = query.eq("parent_id", parentId).order("is_folder", { ascending: false }).order("name");
  } else if (accountId) {
    query = query.eq("account_id", accountId).is("parent_id", null).order("is_folder", { ascending: false }).order("name");
  } else if (path !== null) {
    query = query.eq("path", path ?? "/").order("is_folder", { ascending: false }).order("name");
  } else {
    query = query.is("parent_id", null).order("is_folder", { ascending: false }).order("name").limit(200);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ files: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action, accountId, parentPath, name, fileIds, destinationAccountId, destinationFolderId } =
    body;

  if (action === "create_folder") {
    const { account, credentials } = await getAccountCredentials(
      supabase,
      accountId,
      user.id
    );
    const adapter = getAdapter(account.provider);
    const folder = await adapter.createFolder(credentials, parentPath ?? "/", name);

    const { data: inserted } = await supabase
      .from("file_metadata")
      .insert({
        user_id: user.id,
        account_id: accountId,
        provider_file_id: folder.providerFileId,
        name: folder.name,
        path: folder.path,
        mime_type: folder.mimeType,
        size: 0,
        is_folder: true,
        is_starred: false,
        is_shared: false,
        modified_at: folder.modifiedAt?.toISOString() ?? null,
      })
      .select()
      .single();

    return NextResponse.json({ file: inserted });
  }

  if (action === "move" && fileIds?.length && destinationAccountId) {
    try {
      const result = await moveFiles(supabase, user.id, {
        fileIds,
        destinationAccountId,
        destinationFolderId: destinationFolderId ?? null,
      });
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Move failed" },
        { status: 400 }
      );
    }
  }

  if (action === "bulk_delete" && fileIds?.length) {
    for (const fileId of fileIds as string[]) {
      const { data: file } = await supabase
        .from("file_metadata")
        .select("*")
        .eq("id", fileId)
        .eq("user_id", user.id)
        .single();

      if (file) {
        const { account, credentials } = await getAccountCredentials(
          supabase,
          file.account_id,
          user.id
        );
        const adapter = getAdapter(account.provider);
        await adapter.deleteFile(credentials, file.provider_file_id);
        await supabase.from("file_metadata").delete().eq("id", fileId);
      }
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
