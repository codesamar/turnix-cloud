import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initiateUpload, processUpload } from "@/lib/services/upload";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uploadId = new URL(request.url).searchParams.get("uploadId");
  if (!uploadId) {
    return NextResponse.json({ error: "uploadId required" }, { status: 400 });
  }

  const { data: session, error } = await supabase
    .from("upload_sessions")
    .select("id, filename, progress, status, error_message")
    .eq("id", uploadId)
    .eq("user_id", user.id)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "Upload session not found" }, { status: 404 });
  }

  return NextResponse.json({ session });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    const { filename, size } = body;

    if (!filename) {
      return NextResponse.json({ error: "Filename required" }, { status: 400 });
    }

    const { session, account } = await initiateUpload(
      supabase,
      user.id,
      filename,
      size ?? 0
    );

    return NextResponse.json({
      uploadId: session.id,
      accountId: account.id,
      provider: account.provider,
    });
  }

  const uploadId = request.headers.get("x-upload-id");
  const parentPath = request.headers.get("x-parent-path") ?? "/";
  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (!uploadId || !request.body) {
    return NextResponse.json({ error: "Upload ID and body required" }, { status: 400 });
  }

  try {
    const file = await processUpload(
      supabase,
      user.id,
      uploadId,
      parentPath,
      request.body,
      contentLength
    );
    return NextResponse.json({ file });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
