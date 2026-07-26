"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PROVIDER_LABELS } from "@/lib/adapters/config";
import type { AllocationStrategy, CloudProvider } from "@/lib/types/database";
import { useLanguage } from "@/components/providers/language-provider";
import type { TranslationKey } from "@/lib/i18n/types";
import { getAccountDisplayName } from "@/lib/utils/account-display";

interface UploadDropzoneProps {
  parentPath?: string;
  folderName?: string | null;
  onComplete?: () => void;
}

interface ActiveUpload {
  id: string;
  filename: string;
  progress: number;
  status: string;
  accountLabel?: string;
  provider?: CloudProvider;
}

interface UploadSessionStatus {
  progress: number;
  status: string;
  error_message?: string | null;
}

interface UploadDestination {
  account: {
    id: string;
    label: string;
    email: string | null;
    provider: CloudProvider;
    providerLabel: string;
  };
  folderName: string | null;
  parentPath: string;
  isRoot: boolean;
  strategy: AllocationStrategy;
}

function strategyLabelKey(strategy: AllocationStrategy): TranslationKey {
  return `allocation.strategy.${strategy}.label`;
}

async function fetchUploadDestination(
  parentPath: string,
  folderName: string | null
): Promise<UploadDestination | null> {
  const params = new URLSearchParams({ parentPath });
  if (folderName) params.set("folderName", folderName);

  const response = await fetch(`/api/uploads/destination?${params}`);
  if (!response.ok) return null;
  const data = await response.json();
  return data.destination as UploadDestination;
}

async function fetchUploadStatus(uploadId: string): Promise<UploadSessionStatus | null> {
  const response = await fetch(`/api/uploads?uploadId=${uploadId}`);
  if (!response.ok) return null;
  const data = await response.json();
  return data.session as UploadSessionStatus;
}

function uploadFileWithProgress(
  uploadId: string,
  file: File,
  parentPath: string,
  onProgress: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.setRequestHeader("x-upload-id", uploadId);
    xhr.setRequestHeader("x-parent-path", parentPath);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      onProgress(Math.round((event.loaded / event.total) * 45));
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }

      let message = "Upload failed";
      try {
        const body = JSON.parse(xhr.responseText) as { error?: string };
        if (body.error) message = body.error;
      } catch {
        // ignore
      }
      reject(new Error(message));
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

    xhr.send(file);
  });
}

export function UploadDropzone({
  parentPath = "/",
  folderName = null,
  onComplete,
}: UploadDropzoneProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<ActiveUpload[]>([]);
  const pollTimersRef = useRef<Map<string, number>>(new Map());

  const { data: destination } = useQuery({
    queryKey: ["upload-destination", parentPath, folderName],
    queryFn: () => fetchUploadDestination(parentPath, folderName),
  });

  const updateUpload = useCallback((uploadId: string, patch: Partial<ActiveUpload>) => {
    setUploads((prev) =>
      prev.map((upload) => (upload.id === uploadId ? { ...upload, ...patch } : upload))
    );
  }, []);

  const stopPolling = useCallback((uploadId: string) => {
    const timer = pollTimersRef.current.get(uploadId);
    if (timer !== undefined) {
      window.clearInterval(timer);
      pollTimersRef.current.delete(uploadId);
    }
  }, []);

  const startPolling = useCallback(
    (uploadId: string) => {
      stopPolling(uploadId);

      const poll = async () => {
        const session = await fetchUploadStatus(uploadId);
        if (!session) return;

        updateUpload(uploadId, {
          progress: session.progress,
          status: session.status,
        });

        if (session.status === "completed" || session.status === "failed") {
          stopPolling(uploadId);
        }
      };

      void poll();
      const timer = window.setInterval(() => {
        void poll();
      }, 400);
      pollTimersRef.current.set(uploadId, timer);
    },
    [stopPolling, updateUpload]
  );

  useEffect(() => {
    return () => {
      pollTimersRef.current.forEach((timer) => window.clearInterval(timer));
      pollTimersRef.current.clear();
    };
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!destination) {
        toast.error(t("upload.noAccount"));
        return;
      }

      const initResponse = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, size: file.size }),
      });

      if (!initResponse.ok) {
        let message = "Failed to initiate upload";
        try {
          const body = (await initResponse.json()) as { error?: string };
          if (body.error) message = body.error;
        } catch {
          // ignore
        }
        toast.error(message);
        return;
      }

      const initData = (await initResponse.json()) as {
        uploadId: string;
        account?: { label: string; email: string | null; provider: CloudProvider };
      };

      const accountLabel = initData.account
        ? getAccountDisplayName(initData.account)
        : getAccountDisplayName(destination.account);

      setUploads((prev) => [
        ...prev,
        {
          id: initData.uploadId,
          filename: file.name,
          progress: 0,
          status: "pending",
          accountLabel,
          provider: initData.account?.provider ?? destination.account.provider,
        },
      ]);

      startPolling(initData.uploadId);

      try {
        await uploadFileWithProgress(initData.uploadId, file, parentPath, (progress) => {
          updateUpload(initData.uploadId, { progress, status: "uploading" });
        });

        const session = await fetchUploadStatus(initData.uploadId);
        if (session?.status === "failed") {
          throw new Error(session.error_message ?? "Upload failed");
        }

        updateUpload(initData.uploadId, { progress: 100, status: "completed" });
        stopPolling(initData.uploadId);
        toast.success(`Uploaded ${file.name}`);
        onComplete?.();
        void queryClient.invalidateQueries({ queryKey: ["upload-destination"] });

        window.setTimeout(() => {
          setUploads((prev) => prev.filter((upload) => upload.id !== initData.uploadId));
        }, 3000);
      } catch (err) {
        stopPolling(initData.uploadId);
        const message = err instanceof Error ? err.message : "Upload failed";
        updateUpload(initData.uploadId, { status: "failed", progress: 0 });
        toast.error(`${file.name}: ${message}`);
      }
    },
    [destination, onComplete, parentPath, queryClient, startPolling, stopPolling, t, updateUpload]
  );

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      Array.from(fileList).forEach((file) => {
        void uploadFile(file);
      });
    },
    [uploadFile]
  );

  useEffect(() => {
    function onDragOver(e: DragEvent) {
      e.preventDefault();
      if (e.dataTransfer?.types?.includes("Files")) {
        setIsDragging(true);
      }
    }
    function onDragLeave(e: DragEvent) {
      if (e.relatedTarget === null) {
        setIsDragging(false);
      }
    }
    function onDrop(e: DragEvent) {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer?.files ?? null);
    }

    document.addEventListener("dragover", onDragOver);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("dragleave", onDragLeave);
      document.removeEventListener("drop", onDrop);
    };
  }, [handleFiles]);

  const canUpload = Boolean(destination);
  const folderLabel = destination
    ? destination.isRoot
      ? t("upload.destinationRoot")
      : folderName ?? destination.folderName ?? t("upload.destinationRoot")
    : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canUpload}
          title={t("upload.dropHint")}
          onClick={() => inputRef.current?.click()}
        >
          <Plus className="size-4 mr-1" />
          {t("upload.add")}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          disabled={!canUpload}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {destination && folderLabel ? (
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {getAccountDisplayName(destination.account)}
            {" · "}
            {PROVIDER_LABELS[destination.account.provider]}
            {" · "}
            {folderLabel}
            {" · "}
            {t(strategyLabelKey(destination.strategy))}
            {" · "}
            <Link href="/quota" className="text-primary hover:underline">
              {t("upload.changeAllocation")}
            </Link>
          </p>
        ) : !canUpload ? (
          <p className="text-xs text-muted-foreground">{t("upload.noAccount")}</p>
        ) : null}
      </div>

      {isDragging && canUpload ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-primary bg-background px-8 py-6 shadow-sm">
            <Upload className="size-8 text-primary" />
            <p className="text-sm font-medium">{t("upload.dropOverlay")}</p>
          </div>
        </div>
      ) : null}

      {uploads.map((upload) => (
        <div key={upload.id} className="space-y-1 rounded-md border p-3">
          <div className="flex justify-between text-sm gap-2">
            <span className="truncate font-medium">{upload.filename}</span>
            <span className="text-muted-foreground shrink-0">
              {upload.status === "failed"
                ? t("upload.statusFailed")
                : upload.status === "completed"
                  ? t("upload.statusDone")
                  : `${upload.progress}%`}
            </span>
          </div>
          {upload.accountLabel && (
            <p className="text-xs text-muted-foreground truncate">
              {t("upload.uploadingTo")}: {upload.accountLabel}
              {upload.provider ? ` · ${PROVIDER_LABELS[upload.provider]}` : ""}
            </p>
          )}
          <Progress
            value={upload.status === "completed" ? 100 : upload.progress}
            className={upload.status === "failed" ? "opacity-50" : undefined}
          />
        </div>
      ))}
    </div>
  );
}
