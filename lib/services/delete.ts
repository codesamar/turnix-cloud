import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdapter } from "@/lib/adapters/registry";
import { getAccountCredentials } from "@/lib/services/accounts";

type Supabase = SupabaseClient;

export type DeleteProgressEvent =
  | { type: "start"; total: number }
  | { type: "item"; index: number; total: number; name: string }
  | { type: "item_done"; index: number; total: number; name: string }
  | { type: "complete"; deleted: number };

interface DeleteOptions {
  fileIds: string[];
  onProgress?: (event: DeleteProgressEvent) => void;
}

export async function deleteFiles(
  supabase: Supabase,
  userId: string,
  { fileIds, onProgress }: DeleteOptions
) {
  const total = fileIds.length;
  onProgress?.({ type: "start", total });

  let deleted = 0;

  for (let i = 0; i < fileIds.length; i++) {
    const fileId = fileIds[i];
    const index = i + 1;

    const { data: file } = await supabase
      .from("file_metadata")
      .select("*")
      .eq("id", fileId)
      .eq("user_id", userId)
      .single();

    if (!file) {
      continue;
    }

    onProgress?.({
      type: "item",
      index,
      total,
      name: file.name,
    });

    const { account, credentials } = await getAccountCredentials(
      supabase,
      file.account_id,
      userId
    );
    const adapter = getAdapter(account.provider);
    await adapter.deleteFile(credentials, file.provider_file_id);
    await supabase.from("file_metadata").delete().eq("id", fileId);

    deleted += 1;
    onProgress?.({
      type: "item_done",
      index,
      total,
      name: file.name,
    });
  }

  onProgress?.({ type: "complete", deleted });
  return { deleted };
}
