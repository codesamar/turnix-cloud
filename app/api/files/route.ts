import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccountCredentials } from "@/lib/services/accounts";
import { deleteFiles } from "@/lib/services/delete";
import { moveFiles } from "@/lib/services/move";
import {
  enrichFolderChildCounts,
  refreshFolderInBackground,
  refreshProviderRootsInBackground,
  BROWSE_REFRESH_MAX_PAGES,
} from "@/lib/services/file-metadata";
import { getAdapter } from "@/lib/adapters/registry";
import { toAccountApiError } from "@/lib/utils/account-error";
import {
  applyFileListSort,
  parseFileListLimit,
  parseFileListOffset,
  parseFileListSort,
} from "@/lib/utils/file-list-query";

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
  const provider = searchParams.get("provider");
  const limit = parseFileListLimit(searchParams.get("limit"));
  const offset = parseFileListOffset(searchParams.get("offset"));
  const sort = parseFileListSort(searchParams.get("sort"));
  const isPaginated = limit !== undefined;
  const refreshLive = searchParams.get("refresh") !== "0";
  const shouldRefreshLive =
    refreshLive && offset === 0 && !recent && !starred && !shared;

  if (shouldRefreshLive && parentId) {
    const { data: parent } = await supabase
      .from("file_metadata")
      .select("account_id")
      .eq("id", parentId)
      .eq("user_id", user.id)
      .single();

    if (parent?.account_id) {
      const refreshAccountId = parent.account_id;
      after(async () => {
        try {
          const bgSupabase = await createClient();
          await refreshFolderInBackground(bgSupabase, user.id, {
            parentId,
            accountId: refreshAccountId,
            maxListPages: BROWSE_REFRESH_MAX_PAGES,
            removeStale: false,
          });
        } catch (err) {
          console.error("[files] background folder refresh failed", err);
        }
      });
    }
  } else if (shouldRefreshLive && accountId) {
    after(async () => {
      try {
        const bgSupabase = await createClient();
        await refreshFolderInBackground(bgSupabase, user.id, {
          parentId: null,
          accountId,
          maxListPages: BROWSE_REFRESH_MAX_PAGES,
          removeStale: false,
        });
      } catch (err) {
        console.error("[files] background account root refresh failed", err);
      }
    });
  } else if (shouldRefreshLive && provider && !parentId && !accountId) {
    after(async () => {
      try {
        const bgSupabase = await createClient();
        await refreshProviderRootsInBackground(bgSupabase, user.id, provider);
      } catch (err) {
        console.error("[files] background provider root refresh failed", err);
      }
    });
  }

  // Inner join when filtering by provider so PostgREST can match cloud_accounts.provider
  const select = provider
    ? "*, cloud_accounts!inner(provider, label, email)"
    : "*, cloud_accounts(provider, label, email)";

  let query = supabase
    .from("file_metadata")
    .select(select, isPaginated ? { count: "exact" } : undefined)
    .eq("user_id", user.id);

  if (provider) {
    query = query.eq("cloud_accounts.provider", provider);
  }

  if (recent) {
    query = query.order("modified_at", { ascending: false });
    if (!isPaginated) {
      query = query.limit(50);
    }
  } else if (starred) {
    query = query.eq("is_starred", true);
    query = isPaginated
      ? applyFileListSort(query, sort)
      : query.order("name");
  } else if (shared) {
    query = query.eq("is_shared", true).order("modified_at", { ascending: false });
  } else if (parentId) {
    query = query.eq("parent_id", parentId);
    query = isPaginated
      ? applyFileListSort(query, sort)
      : query
          .order("is_folder", { ascending: false })
          .order("name");
  } else if (accountId) {
    query = query.eq("account_id", accountId).is("parent_id", null);
    query = isPaginated
      ? applyFileListSort(query, sort)
      : query
          .order("is_folder", { ascending: false })
          .order("name");
  } else if (path !== null) {
    query = query.eq("path", path ?? "/");
    query = isPaginated
      ? applyFileListSort(query, sort)
      : query
          .order("is_folder", { ascending: false })
          .order("name");
  } else {
    query = query.is("parent_id", null);
    query = isPaginated
      ? applyFileListSort(query, sort)
      : query
          .order("is_folder", { ascending: false })
          .order("name")
          .limit(200);
  }

  if (isPaginated && limit !== undefined) {
    query = query.range(offset, offset + limit - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const files = await enrichFolderChildCounts(supabase, user.id, data ?? []);

  if (isPaginated && limit !== undefined) {
    const total = count ?? files.length;
    return NextResponse.json({
      files,
      total,
      hasMore: offset + files.length < total,
    });
  }

  return NextResponse.json({ files });
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
        child_count: 0,
        modified_at: folder.modifiedAt?.toISOString() ?? null,
      })
      .select()
      .single();

    return NextResponse.json({ file: inserted });
  }

  if (action === "move" && fileIds?.length && destinationAccountId) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        };

        try {
          await moveFiles(supabase, user.id, {
            fileIds,
            destinationAccountId,
            destinationFolderId: destinationFolderId ?? null,
            onProgress: (event) => send(event),
          });
        } catch (err) {
          console.error("[move]", err);
          send({ type: "error", ...toAccountApiError(err) });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  }

  if (action === "bulk_delete" && fileIds?.length) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        };

        try {
          await deleteFiles(supabase, user.id, {
            fileIds,
            onProgress: (event) => send(event),
          });
        } catch (err) {
          console.error("[bulk_delete]", err);
          send({ type: "error", ...toAccountApiError(err) });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
