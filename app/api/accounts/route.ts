import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { listAccounts } from "@/lib/services/accounts";

const FILE_DELETE_BATCH = 200;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await listAccounts(supabase, user.id);
  return NextResponse.json({ accounts });
}

async function deleteFileMetadataBatched(
  admin: ReturnType<typeof createAdminClient>,
  accountId: string,
  userId: string
) {
  // Avoid one huge UPDATE/DELETE (hits statement timeout ~8s). Delete by id batches.
  for (;;) {
    const { data: rows, error: selectError } = await admin
      .from("file_metadata")
      .select("id")
      .eq("account_id", accountId)
      .eq("user_id", userId)
      .limit(FILE_DELETE_BATCH);

    if (selectError) {
      throw new Error(`List file metadata failed: ${selectError.message}`);
    }

    if (!rows?.length) break;

    const ids = rows.map((row) => row.id);

    // Clear parent links inside this batch so self-FK does not block deletes.
    const { error: unlinkError } = await admin
      .from("file_metadata")
      .update({ parent_id: null })
      .in("id", ids);

    if (unlinkError) {
      throw new Error(`Unlink file parents failed: ${unlinkError.message}`);
    }

    const { error: deleteError } = await admin
      .from("file_metadata")
      .delete()
      .in("id", ids);

    if (deleteError) {
      throw new Error(`Delete file metadata failed: ${deleteError.message}`);
    }

    if (rows.length < FILE_DELETE_BATCH) break;
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Account ID required" }, { status: 400 });
  }

  const { data: account, error: accountLookupError } = await supabase
    .from("cloud_accounts")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (accountLookupError) {
    return NextResponse.json(
      { error: accountLookupError.message },
      { status: 500 }
    );
  }

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  try {
    const admin = createAdminClient();

    await deleteFileMetadataBatched(admin, id, user.id);

    const { error: sessionsError } = await admin
      .from("upload_sessions")
      .delete()
      .eq("account_id", id)
      .eq("user_id", user.id);

    if (sessionsError) {
      throw new Error(`Delete upload sessions failed: ${sessionsError.message}`);
    }

    const { error: deleteError } = await admin
      .from("cloud_accounts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      throw new Error(`Delete account failed: ${deleteError.message}`);
    }

    const { data: allocation } = await admin
      .from("allocation_config")
      .select("manual_order, weights")
      .eq("user_id", user.id)
      .maybeSingle();

    if (allocation) {
      const manualOrder = Array.isArray(allocation.manual_order)
        ? (allocation.manual_order as string[]).filter((item) => item !== id)
        : [];
      const weights =
        allocation.weights && typeof allocation.weights === "object"
          ? { ...(allocation.weights as Record<string, unknown>) }
          : {};
      delete weights[id];

      await admin
        .from("allocation_config")
        .update({
          manual_order: manualOrder,
          weights,
        })
        .eq("user_id", user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to disconnect account";
    console.error("[accounts:DELETE]", id, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
