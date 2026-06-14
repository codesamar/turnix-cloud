import type { SupabaseClient } from "@supabase/supabase-js";
import type { FileMetadata } from "@/lib/types/database";
import { getAdapter } from "@/lib/adapters/registry";
import { getAccountCredentials } from "@/lib/services/accounts";

type Supabase = SupabaseClient;

interface MoveOptions {
  fileIds: string[];
  destinationAccountId: string;
  destinationFolderId: string | null;
}

async function loadFile(
  supabase: Supabase,
  userId: string,
  fileId: string
): Promise<FileMetadata> {
  const { data: file, error } = await supabase
    .from("file_metadata")
    .select("*")
    .eq("id", fileId)
    .eq("user_id", userId)
    .single();

  if (error || !file) {
    throw new Error("File not found");
  }

  return file as FileMetadata;
}

async function resolveDestination(
  supabase: Supabase,
  userId: string,
  destinationAccountId: string,
  destinationFolderId: string | null
): Promise<{ parentMetadataId: string | null; parentProviderPath: string }> {
  if (!destinationFolderId) {
    return { parentMetadataId: null, parentProviderPath: "/" };
  }

  const { data: folder, error } = await supabase
    .from("file_metadata")
    .select("*")
    .eq("id", destinationFolderId)
    .eq("user_id", userId)
    .eq("account_id", destinationAccountId)
    .single();

  if (error || !folder || !folder.is_folder) {
    throw new Error("Destination folder not found");
  }

  return {
    parentMetadataId: folder.id,
    parentProviderPath: folder.provider_file_id,
  };
}

async function isAncestorOf(
  supabase: Supabase,
  ancestorId: string,
  descendantId: string
): Promise<boolean> {
  let currentId: string | null = descendantId;

  while (currentId) {
    if (currentId === ancestorId) return true;

    const result: { data: { parent_id: string | null } | null } = await supabase
      .from("file_metadata")
      .select("parent_id")
      .eq("id", currentId)
      .single();

    currentId = result.data?.parent_id ?? null;
  }

  return false;
}

async function upsertMovedMetadata(
  supabase: Supabase,
  userId: string,
  accountId: string,
  parentId: string | null,
  normalized: {
    providerFileId: string;
    name: string;
    path: string;
    mimeType: string | null;
    size: number;
    isFolder: boolean;
    isStarred: boolean;
    isShared: boolean;
    modifiedAt: Date | null;
  },
  existing?: Pick<FileMetadata, "is_starred" | "is_shared">
) {
  const { data, error } = await supabase
    .from("file_metadata")
    .upsert(
      {
        user_id: userId,
        account_id: accountId,
        provider_file_id: normalized.providerFileId,
        name: normalized.name,
        path: normalized.path,
        mime_type: normalized.mimeType,
        size: normalized.size,
        is_folder: normalized.isFolder,
        is_starred: existing?.is_starred ?? normalized.isStarred,
        is_shared: existing?.is_shared ?? normalized.isShared,
        parent_id: parentId,
        modified_at: normalized.modifiedAt?.toISOString() ?? null,
        synced_at: new Date().toISOString(),
      },
      { onConflict: "account_id,provider_file_id" }
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update file metadata");
  }

  return data as FileMetadata;
}

async function moveSameAccount(
  supabase: Supabase,
  userId: string,
  file: FileMetadata,
  destination: { parentMetadataId: string | null; parentProviderPath: string }
) {
  const { account, credentials } = await getAccountCredentials(
    supabase,
    file.account_id,
    userId
  );
  const adapter = getAdapter(account.provider);
  const moved = await adapter.move(
    credentials,
    file.provider_file_id,
    destination.parentProviderPath
  );

  await supabase
    .from("file_metadata")
    .update({
      parent_id: destination.parentMetadataId,
      provider_file_id: moved.providerFileId,
      path: moved.path,
      name: moved.name,
      mime_type: moved.mimeType,
      size: moved.size,
      modified_at: moved.modifiedAt?.toISOString() ?? null,
      synced_at: new Date().toISOString(),
    })
    .eq("id", file.id);
}

async function transferCrossAccount(
  supabase: Supabase,
  userId: string,
  file: FileMetadata,
  destinationAccountId: string,
  destination: { parentMetadataId: string | null; parentProviderPath: string }
) {
  const { account: sourceAccount, credentials: sourceCredentials } =
    await getAccountCredentials(supabase, file.account_id, userId);
  const { account: destAccount, credentials: destCredentials } =
    await getAccountCredentials(supabase, destinationAccountId, userId);

  const sourceAdapter = getAdapter(sourceAccount.provider);
  const destAdapter = getAdapter(destAccount.provider);

  if (file.is_folder) {
    const created = await destAdapter.createFolder(
      destCredentials,
      destination.parentProviderPath,
      file.name
    );

    const newFolder = await upsertMovedMetadata(
      supabase,
      userId,
      destinationAccountId,
      destination.parentMetadataId,
      created,
      file
    );

    const { data: children } = await supabase
      .from("file_metadata")
      .select("*")
      .eq("parent_id", file.id)
      .eq("user_id", userId);

    for (const child of (children ?? []) as FileMetadata[]) {
      await transferCrossAccount(supabase, userId, child, destinationAccountId, {
        parentMetadataId: newFolder.id,
        parentProviderPath: created.providerFileId,
      });
    }

    await sourceAdapter.deleteFile(sourceCredentials, file.provider_file_id);
    await supabase.from("file_metadata").delete().eq("id", file.id);
    return;
  }

  const { stream, name } = await sourceAdapter.download(
    sourceCredentials,
    file.provider_file_id
  );

  const uploaded = await destAdapter.upload(
    destCredentials,
    destination.parentProviderPath,
    name,
    stream,
    file.size
  );

  await sourceAdapter.deleteFile(sourceCredentials, file.provider_file_id);
  await supabase.from("file_metadata").delete().eq("id", file.id);

  await upsertMovedMetadata(
    supabase,
    userId,
    destinationAccountId,
    destination.parentMetadataId,
    uploaded,
    file
  );
}

export async function moveFiles(
  supabase: Supabase,
  userId: string,
  options: MoveOptions
): Promise<{ moved: number }> {
  const { fileIds, destinationAccountId, destinationFolderId } = options;

  if (!fileIds.length) {
    throw new Error("No files selected");
  }

  const destination = await resolveDestination(
    supabase,
    userId,
    destinationAccountId,
    destinationFolderId
  );

  const files: FileMetadata[] = [];
  for (const fileId of fileIds) {
    files.push(await loadFile(supabase, userId, fileId));
  }

  const folderIds = files.filter((file) => file.is_folder).map((file) => file.id);

  for (const file of files) {
    if (
      file.account_id === destinationAccountId &&
      file.parent_id === destination.parentMetadataId
    ) {
      continue;
    }

    if (destination.parentMetadataId) {
      for (const folderId of folderIds) {
        if (
          file.id === destination.parentMetadataId ||
          (await isAncestorOf(supabase, folderId, destination.parentMetadataId))
        ) {
          throw new Error(`Cannot move "${file.name}" into itself or a subfolder`);
        }
      }
    }

    if (file.account_id === destinationAccountId) {
      await moveSameAccount(supabase, userId, file, destination);
    } else {
      await transferCrossAccount(
        supabase,
        userId,
        file,
        destinationAccountId,
        destination
      );
    }
  }

  return { moved: files.length };
}
