"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronRight, Folder, FolderInput, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/components/providers/language-provider";
import type { CloudAccount, FileMetadata, FileMetadataWithAccount } from "@/lib/types/database";
import { getAccountDisplayName } from "@/lib/utils/account-display";

interface MoveFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: FileMetadata[];
  onMoved: () => void;
}

async function fetchAccounts() {
  const response = await fetch("/api/accounts");
  if (!response.ok) throw new Error("Failed to fetch accounts");
  const data = await response.json();
  return data.accounts as CloudAccount[];
}

async function fetchFolders(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch folders");
  const data = await response.json();
  return (data.files as FileMetadataWithAccount[]).filter((file) => file.is_folder);
}

export function MoveFileDialog({
  open,
  onOpenChange,
  files,
  onMoved,
}: MoveFileDialogProps) {
  const { t } = useLanguage();
  const [destinationAccountId, setDestinationAccountId] = useState("");
  const [folderStack, setFolderStack] = useState<FileMetadata[]>([]);

  const movingFolderIds = useMemo(
    () => new Set(files.filter((file) => file.is_folder).map((file) => file.id)),
    [files]
  );

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
    enabled: open,
  });

  useEffect(() => {
    if (!open || accounts.length === 0) return;

    const defaultAccount =
      files[0]?.account_id && accounts.some((account) => account.id === files[0].account_id)
        ? files[0].account_id
        : accounts[0].id;

    setDestinationAccountId(defaultAccount);
    setFolderStack([]);
  }, [open, accounts, files]);

  const currentFolder = folderStack[folderStack.length - 1] ?? null;
  const foldersUrl = currentFolder
    ? `/api/files?parentId=${currentFolder.id}`
    : `/api/files?accountId=${destinationAccountId}`;

  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ["move-folders", destinationAccountId, currentFolder?.id ?? "root"],
    queryFn: () => fetchFolders(foldersUrl),
    enabled: open && Boolean(destinationAccountId),
  });

  const moveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "move",
          fileIds: files.map((file) => file.id),
          destinationAccountId,
          destinationFolderId: currentFolder?.id ?? null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Move failed");
      }

      return data;
    },
    onSuccess: () => {
      toast.success(t("move.success"));
      onOpenChange(false);
      onMoved();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function handleAccountChange(accountId: string) {
    setDestinationAccountId(accountId);
    setFolderStack([]);
  }

  function handleOpenFolder(folder: FileMetadata) {
    setFolderStack((prev) => [...prev, folder]);
  }

  function handleBreadcrumbClick(index: number) {
    if (index < 0) {
      setFolderStack([]);
      return;
    }
    setFolderStack((prev) => prev.slice(0, index + 1));
  }

  function isBlockedDestination(folder: FileMetadata) {
    if (movingFolderIds.has(folder.id)) return true;

    for (const movingId of movingFolderIds) {
      let current: string | null = folder.id;
      while (current) {
        if (current === movingId) return true;
        const parent = folderStack.find((item) => item.id === current)?.parent_id;
        if (parent) {
          current = parent;
          continue;
        }
        break;
      }
    }

    return false;
  }

  const itemLabel =
    files.length === 1
      ? files[0].name
      : t("move.itemCount").replace("{count}", String(files.length));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("move.title")}</DialogTitle>
          <DialogDescription>
            {t("move.description").replace("{name}", itemLabel)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("move.destinationAccount")}</Label>
            <Select value={destinationAccountId} onValueChange={handleAccountChange}>
              <SelectTrigger>
                <SelectValue placeholder={t("move.selectAccount")} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {getAccountDisplayName(account)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("move.destinationFolder")}</Label>
            <div className="rounded-md border">
              <div className="flex flex-wrap items-center gap-1 border-b px-3 py-2 text-sm text-muted-foreground">
                <button
                  type="button"
                  className="hover:text-foreground"
                  onClick={() => handleBreadcrumbClick(-1)}
                >
                  {t("move.rootFolder")}
                </button>
                {folderStack.map((folder, index) => (
                  <span key={folder.id} className="flex items-center gap-1">
                    <ChevronRight className="size-3" />
                    <button
                      type="button"
                      className="hover:text-foreground truncate max-w-[140px]"
                      onClick={() => handleBreadcrumbClick(index)}
                    >
                      {folder.name}
                    </button>
                  </span>
                ))}
              </div>

              <div className="max-h-52 overflow-y-auto">
                {foldersLoading && (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    {t("move.loadingFolders")}
                  </div>
                )}

                {!foldersLoading && folders.length === 0 && (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {t("move.noSubfolders")}
                  </p>
                )}

                {!foldersLoading &&
                  folders.map((folder) => {
                    const blocked = isBlockedDestination(folder);
                    return (
                      <button
                        key={folder.id}
                        type="button"
                        disabled={blocked}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => handleOpenFolder(folder)}
                      >
                        <Folder className="size-4 shrink-0 text-blue-500" />
                        <span className="truncate">{folder.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t("move.folderHint")}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("move.cancel")}
          </Button>
          <Button
            onClick={() => moveMutation.mutate()}
            disabled={!destinationAccountId || moveMutation.isPending}
          >
            {moveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t("move.moving")}
              </>
            ) : (
              <>
                <FolderInput className="mr-2 size-4" />
                {t("move.confirm")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
