import type { SupabaseClient } from "@supabase/supabase-js";
import type { CloudAccount, UploadSession } from "@/lib/types/database";
import { getAdapter } from "@/lib/adapters/registry";
import { getAccountCredentials } from "@/lib/services/accounts";
import { selectUploadAccount } from "@/lib/services/allocation";

type Supabase = SupabaseClient;

export async function initiateUpload(
  supabase: Supabase,
  userId: string,
  filename: string,
  size: number
): Promise<{ session: UploadSession; account: CloudAccount }> {
  const account = await selectUploadAccount(supabase, userId);

  const { data: session, error } = await supabase
    .from("upload_sessions")
    .insert({
      user_id: userId,
      account_id: account.id,
      filename,
      size,
      status: "pending",
      progress: 0,
    })
    .select("*")
    .single();

  if (error || !session) {
    throw new Error(error?.message ?? "Failed to create upload session");
  }

  return { session: session as UploadSession, account };
}

export async function processUpload(
  supabase: Supabase,
  userId: string,
  uploadId: string,
  parentPath: string,
  data: ReadableStream<Uint8Array>,
  size: number
) {
  const { data: session, error } = await supabase
    .from("upload_sessions")
    .select("*")
    .eq("id", uploadId)
    .eq("user_id", userId)
    .single();

  if (error || !session) {
    throw new Error("Upload session not found");
  }

  const uploadSession = session as UploadSession;

  await supabase
    .from("upload_sessions")
    .update({ status: "uploading", progress: 0 })
    .eq("id", uploadId);

  const { account, credentials } = await getAccountCredentials(
    supabase,
    uploadSession.account_id,
    userId
  );
  const adapter = getAdapter(account.provider);

  try {
    const file = await adapter.upload(
      credentials,
      parentPath,
      uploadSession.filename,
      data,
      size,
      async (progress) => {
        await supabase
          .from("upload_sessions")
          .update({ progress })
          .eq("id", uploadId);
      }
    );

    await supabase.from("file_metadata").upsert(
      {
        user_id: userId,
        account_id: account.id,
        provider_file_id: file.providerFileId,
        name: file.name,
        path: file.path,
        mime_type: file.mimeType,
        size: file.size,
        is_folder: file.isFolder,
        is_starred: file.isStarred,
        is_shared: file.isShared,
        modified_at: file.modifiedAt?.toISOString() ?? null,
        synced_at: new Date().toISOString(),
      },
      { onConflict: "account_id,provider_file_id" }
    );

    await supabase
      .from("upload_sessions")
      .update({ status: "completed", progress: 100 })
      .eq("id", uploadId);

    return file;
  } catch (err) {
    await supabase
      .from("upload_sessions")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "Upload failed",
      })
      .eq("id", uploadId);
    throw err;
  }
}
