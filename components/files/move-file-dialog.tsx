"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ChevronRight, Folder, FolderInput, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/components/providers/language-provider";
import type { MoveItemPhase } from "@/lib/services/move";
import type { CloudAccount, FileMetadata, FileMetadataWithAccount } from "@/lib/types/database";
import {
  ACCOUNT_DISCONNECTED_CODE,
  isTokenExpiredError,
} from "@/lib/utils/account-error";
import { getFileAccountLabel } from "@/lib/utils/account-display";

interface MoveFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: FileMetadata[];
  onMoved: () => void;
}

interface MoveProgressState {
  index: number;
  total: number;
  name: string;
  phase: MoveItemPhase;
  percent?: number;
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

function overallPercent(progress: MoveProgressState | null): number {
  if (!progress || progress.total <= 0) return 0;
  const slice = 100 / progress.total;
  const base = (progress.index - 1) * slice;
  let within = 0.15 * slice;
  if (progress.phase === "download") within = 0.3 * slice;
  if (progress.phase === "upload") {
    within =
      (typeof progress.percent === "number" ? progress.percent / 100 : 0.5) *
      slice;
  }
  if (progress.phase === "finalize") within = 0.9 * slice;
  if (progress.phase === "moving") within = 0.5 * slice;
  return Math.min(99, Math.round(base + within));
}

export function MoveFileDialog({
  open,
  onOpenChange,
  files,
  onMoved,
}: MoveFileDialogProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [destinationAccountId, setDestinationAccountId] = useState("");
  const [folderStack, setFolderStack] = useState<FileMetadata[]>([]);
  const [progress, setProgress] = useState<MoveProgressState | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const movingFolderIds = useMemo(
    () => new Set(files.filter((file) => file.is_folder).map((file) => file.id)),
    [files]
  );

  const isCrossAccount = useMemo(
    () =>
      Boolean(destinationAccountId) &&
      files.some((file) => file.account_id !== destinationAccountId),
    [destinationAccountId, files]
  );

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
    enabled: open,
  });

  const isAccountDisconnected = (account: CloudAccount) =>
    account.status === "error" && isTokenExpiredError(account.error_message);

  useEffect(() => {
    if (!open || accounts.length === 0) return;

    const preferredId = files[0]?.account_id;
    const preferred = preferredId
      ? accounts.find((account) => account.id === preferredId)
      : undefined;
    const firstActive = accounts.find((account) => !isAccountDisconnected(account));
    const defaultAccountId =
      (preferred && !isAccountDisconnected(preferred) ? preferred.id : undefined) ??
      firstActive?.id ??
      preferred?.id ??
      accounts[0].id;

    setDestinationAccountId(defaultAccountId);
    setFolderStack([]);
    setProgress(null);
  }, [open, accounts, files]);

  const selectedAccount = accounts.find(
    (account) => account.id === destinationAccountId
  );
  const selectedDisconnected = selectedAccount
    ? isAccountDisconnected(selectedAccount)
    : false;

  const currentFolder = folderStack[folderStack.length - 1] ?? null;
  const foldersUrl = currentFolder
    ? `/api/files?parentId=${currentFolder.id}`
    : `/api/files?accountId=${destinationAccountId}`;

  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ["move-folders", destinationAccountId, currentFolder?.id ?? "root"],
    queryFn: () => fetchFolders(foldersUrl),
    enabled: open && Boolean(destinationAccountId) && !selectedDisconnected,
  });

  const moveMutation = useMutation({
    mutationFn: async () => {
      if (selectedDisconnected && selectedAccount) {
        throw Object.assign(new Error(ACCOUNT_DISCONNECTED_CODE), {
          code: ACCOUNT_DISCONNECTED_CODE,
          accountLabel: getFileAccountLabel(selectedAccount),
        });
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setProgress({
        index: 1,
        total: Math.max(files.length, 1),
        name: files[0]?.name ?? "",
        phase: "moving",
      });

      const response = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "move",
          fileIds: files.map((file) => file.id),
          destinationAccountId,
          destinationFolderId: currentFolder?.id ?? null,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
          code?: string;
          accountLabel?: string;
        };
        throw Object.assign(new Error(data.error ?? "Move failed"), {
          code: data.code,
          accountLabel: data.accountLabel,
        });
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let moved = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as {
            type: string;
            total?: number;
            index?: number;
            name?: string;
            phase?: MoveItemPhase;
            percent?: number;
            moved?: number;
            error?: string;
            message?: string;
            code?: string;
            accountLabel?: string;
          };

          if (event.type === "error") {
            throw Object.assign(
              new Error(event.error ?? event.message ?? "Move failed"),
              {
                code: event.code,
                accountLabel: event.accountLabel,
              }
            );
          }

          if (event.type === "start" && typeof event.total === "number") {
            setProgress({
              index: 1,
              total: event.total,
              name: files[0]?.name ?? "",
              phase: "moving",
            });
            continue;
          }

          if (
            event.type === "item" &&
            typeof event.index === "number" &&
            typeof event.total === "number" &&
            event.name &&
            event.phase
          ) {
            setProgress({
              index: event.index,
              total: event.total,
              name: event.name,
              phase: event.phase,
              percent: event.percent,
            });
            continue;
          }

          if (
            event.type === "item_done" &&
            typeof event.index === "number" &&
            typeof event.total === "number" &&
            event.name
          ) {
            setProgress({
              index: event.index,
              total: event.total,
              name: event.name,
              phase: "moving",
              percent: 100,
            });
            continue;
          }

          if (event.type === "complete" && typeof event.moved === "number") {
            moved = event.moved;
          }
        }
      }

      return { moved };
    },
    onSuccess: () => {
      abortRef.current = null;
      setProgress(null);
      toast.success(t("move.success"));
      onOpenChange(false);
      onMoved();
    },
    onError: (error: Error & { code?: string; accountLabel?: string; name?: string }) => {
      abortRef.current = null;
      setProgress(null);
      if (error.name === "AbortError") {
        toast.message(t("move.cancelled"));
        return;
      }
      if (error.code === ACCOUNT_DISCONNECTED_CODE) {
        const label =
          error.accountLabel ||
          (selectedAccount
            ? getFileAccountLabel(selectedAccount)
            : t("move.destinationAccount"));
        void queryClient.invalidateQueries({ queryKey: ["accounts"] });
        toast.error(t("move.accountDisconnected").replace("{account}", label));
        return;
      }
      toast.error(error.message);
    },
  });

  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen && moveMutation.isPending) {
      abortRef.current?.abort();
    }
    if (!nextOpen) setProgress(null);
    onOpenChange(nextOpen);
  }

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

  function phaseLabel(phase: MoveItemPhase) {
    switch (phase) {
      case "download":
        return t("move.phaseDownload");
      case "upload":
        return t("move.phaseUpload");
      case "finalize":
        return t("move.phaseFinalize");
      default:
        return t("move.phaseMoving");
    }
  }

  const itemLabel =
    files.length === 1
      ? files[0].name
      : t("move.itemCount").replace("{count}", String(files.length));

  const barValue =
    moveMutation.isPending && progress ? overallPercent(progress) : 0;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("move.title")}</DialogTitle>
          <DialogDescription>
            {t("move.description").replace("{name}", itemLabel)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isCrossAccount && !moveMutation.isPending ? (
            <Alert>
              <AlertDescription>{t("move.crossAccountHint")}</AlertDescription>
            </Alert>
          ) : null}

          {moveMutation.isPending && progress ? (
            <div className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">
                  {t("move.progressFile")
                    .replace("{current}", String(progress.index))
                    .replace("{total}", String(progress.total))}
                </span>
                <span className="text-muted-foreground">{barValue}%</span>
              </div>
              <p className="truncate text-sm text-muted-foreground" title={progress.name}>
                {progress.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {phaseLabel(progress.phase)}
                {progress.phase === "upload" &&
                typeof progress.percent === "number"
                  ? ` ${progress.percent}%`
                  : ""}
              </p>
              <Progress value={barValue} />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>{t("move.destinationAccount")}</Label>
            <Select
              value={destinationAccountId}
              onValueChange={handleAccountChange}
              disabled={moveMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("move.selectAccount")} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => {
                  const disconnected = isAccountDisconnected(account);
                  return (
                    <SelectItem key={account.id} value={account.id}>
                      <span className="flex items-center gap-2">
                        <span>{getFileAccountLabel(account)}</span>
                        {disconnected && (
                          <span className="text-xs text-destructive">
                            ({t("move.accountDisconnectedBadge")})
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedDisconnected && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{t("move.accountNeedsReconnect")}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("move.destinationFolder")}</Label>
            <div className="rounded-md border">
              <div className="flex flex-wrap items-center gap-1 border-b px-3 py-2 text-sm text-muted-foreground">
                <button
                  type="button"
                  className="hover:text-foreground"
                  onClick={() => handleBreadcrumbClick(-1)}
                  disabled={selectedDisconnected || moveMutation.isPending}
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
                      disabled={selectedDisconnected || moveMutation.isPending}
                    >
                      {folder.name}
                    </button>
                  </span>
                ))}
              </div>

              <div className="max-h-52 overflow-y-auto">
                {selectedDisconnected && (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {t("move.accountNeedsReconnect")}
                  </p>
                )}

                {!selectedDisconnected && foldersLoading && (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    {t("move.loadingFolders")}
                  </div>
                )}

                {!selectedDisconnected && !foldersLoading && folders.length === 0 && (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {t("move.noSubfolders")}
                  </p>
                )}

                {!selectedDisconnected &&
                  !foldersLoading &&
                  folders.map((folder) => {
                    const blocked = isBlockedDestination(folder);
                    return (
                      <button
                        key={folder.id}
                        type="button"
                        disabled={blocked || moveMutation.isPending}
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
          <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>
            {t("move.cancel")}
          </Button>
          <Button
            onClick={() => moveMutation.mutate()}
            disabled={
              !destinationAccountId ||
              selectedDisconnected ||
              moveMutation.isPending
            }
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
