"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/components/providers/language-provider";
import type { FileMetadata } from "@/lib/types/database";
import {
  ACCOUNT_DISCONNECTED_CODE,
} from "@/lib/utils/account-error";

interface DeleteFilesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: FileMetadata[];
  onDeleted: () => void;
}

interface DeleteProgressState {
  index: number;
  total: number;
  name: string;
  done?: boolean;
}

function overallPercent(progress: DeleteProgressState | null): number {
  if (!progress || progress.total <= 0) return 0;
  if (progress.done) {
    return Math.min(99, Math.round((progress.index / progress.total) * 100));
  }
  const slice = 100 / progress.total;
  const base = (progress.index - 1) * slice;
  return Math.min(99, Math.round(base + slice * 0.4));
}

export function DeleteFilesDialog({
  open,
  onOpenChange,
  files,
  onDeleted,
}: DeleteFilesDialogProps) {
  const { t } = useLanguage();
  const [progress, setProgress] = useState<DeleteProgressState | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const finishedRef = useRef(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      finishedRef.current = false;
      setProgress({
        index: 1,
        total: files.length,
        name: files[0]?.name ?? "",
      });

      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_delete",
          fileIds: files.map((file) => file.id),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Delete failed");
      }

      if (!response.body) {
        throw new Error("Delete failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let deleted = 0;

      const handleEvent = (event: {
        type: string;
        total?: number;
        index?: number;
        name?: string;
        deleted?: number;
        error?: string;
        message?: string;
        code?: string;
        accountLabel?: string;
      }) => {
        if (event.type === "error") {
          throw Object.assign(
            new Error(event.error ?? event.message ?? "Delete failed"),
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
          });
          return;
        }

        if (
          event.type === "item" &&
          typeof event.index === "number" &&
          typeof event.total === "number" &&
          event.name
        ) {
          setProgress({
            index: event.index,
            total: event.total,
            name: event.name,
          });
          return;
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
            done: true,
          });
          return;
        }

        if (event.type === "complete" && typeof event.deleted === "number") {
          deleted = event.deleted;
          finishedRef.current = true;
          abortRef.current = null;
          setProgress(null);
          toast.success(t("delete.success"));
          onOpenChange(false);
          onDeleted();
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          handleEvent(JSON.parse(line));
        }
      }

      if (buffer.trim()) {
        handleEvent(JSON.parse(buffer));
      }

      return { deleted };
    },
    onSuccess: () => {
      abortRef.current = null;
      if (finishedRef.current) {
        finishedRef.current = false;
        return;
      }
      finishedRef.current = false;
      setProgress(null);
      toast.success(t("delete.success"));
      onOpenChange(false);
      onDeleted();
    },
    onError: (error: Error & { code?: string; name?: string }) => {
      abortRef.current = null;
      setProgress(null);
      if (finishedRef.current) {
        finishedRef.current = false;
        return;
      }
      if (error.name === "AbortError") {
        toast.message(t("delete.cancelled"));
        return;
      }
      if (error.code === ACCOUNT_DISCONNECTED_CODE) {
        toast.error(t("delete.accountDisconnected"));
        return;
      }
      toast.error(error.message);
    },
  });

  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen && deleteMutation.isPending && !finishedRef.current) {
      abortRef.current?.abort();
    }
    if (!nextOpen) setProgress(null);
    onOpenChange(nextOpen);
  }

  const itemLabel =
    files.length === 1
      ? files[0].name
      : t("delete.itemCount").replace("{count}", String(files.length));

  const isDeleting = deleteMutation.isPending;
  const percent = progress ? overallPercent(progress) : isDeleting ? 5 : 0;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => {
          if (isDeleting) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("delete.title")}</DialogTitle>
          <DialogDescription>
            {isDeleting
              ? t("delete.deletingHint")
              : t("delete.description").replace("{name}", itemLabel)}
          </DialogDescription>
        </DialogHeader>

        {isDeleting && (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium">
                {progress?.name ?? itemLabel}
              </span>
              {progress && (
                <span className="shrink-0 text-muted-foreground">
                  {t("delete.progressFile")
                    .replace("{current}", String(progress.index))
                    .replace("{total}", String(progress.total))}
                </span>
              )}
            </div>
            <Progress value={percent} />
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t("delete.deleting")}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDialogOpenChange(false)}
          >
            {t("delete.cancel")}
          </Button>
          {!isDeleting && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={files.length === 0}
            >
              <Trash2 className="size-4 mr-1" />
              {t("delete.confirm")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
