"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Cloud, FolderOpen, Upload } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

function UploadDestinationPreview({
  destination,
  folderName,
}: {
  destination: UploadDestination | null | undefined;
  folderName: string | null;
}) {
  const { t } = useLanguage();

  if (destination === undefined) {
    return (
      <p className="text-xs text-muted-foreground mt-3 animate-pulse">
        {t("upload.destinationTitle")}...
      </p>
    );
  }

  if (!destination) {
    return (
      <Alert className="mt-3 text-left">
        <AlertDescription>{t("upload.noAccount")}</AlertDescription>
      </Alert>
    );
  }

  const accountName = getAccountDisplayName(destination.account);
  const folderLabel = destination.isRoot
    ? t("upload.destinationRoot")
    : folderName ?? destination.folderName ?? t("upload.destinationRoot");

  return (
    <div className="mt-3 w-full rounded-md border bg-muted/40 p-3 text-left text-xs space-y-2">
      <p className="font-medium text-foreground">{t("upload.destinationTitle")}</p>
      <div className="flex items-start gap-2 text-muted-foreground">
        <Cloud className="size-3.5 mt-0.5 shrink-0" />
        <div>
          <span className="text-foreground/80">{t("upload.destinationAccount")}: </span>
          {accountName}
          <span className="text-muted-foreground">
            {" "}
            · {PROVIDER_LABELS[destination.account.provider]}
          </span>
        </div>
      </div>
      <div className="flex items-start gap-2 text-muted-foreground">
        <FolderOpen className="size-3.5 mt-0.5 shrink-0" />
        <div>
          <span className="text-foreground/80">{t("upload.destinationFolder")}: </span>
          <span className="text-foreground">{folderLabel}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
        <span>
          {t("upload.destinationStrategy")}: {t(strategyLabelKey(destination.strategy))}
        </span>
        <Link href="/quota" className="text-primary hover:underline">
          {t("upload.changeAllocation")}
        </Link>
      </div>
    </div>
  );
}

export function UploadDropzone({
  parentPath = "/",
  folderName = null,
  onComplete,
}: UploadDropzoneProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<ActiveUpload[]>([]);
  const pollTimersRef = useRef<Map<string, number>>(new Map());

  const { data: destination, isLoading: isDestinationLoading } = useQuery({
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
      setIsDragging(true);
    }
    function onDragLeave() {
      setIsDragging(false);
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

  return (
    <div className="space-y-3">
      <label
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
          !canUpload
            ? "cursor-not-allowed opacity-60"
            : isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <Upload className="size-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium">{t("upload.dropTitle")}</p>
        <p className="text-xs text-muted-foreground mt-1 text-center px-2">
          {t("upload.dropHint")}
        </p>
        <UploadDestinationPreview
          destination={isDestinationLoading ? undefined : destination}
          folderName={folderName}
        />
        <input
          type="file"
          multiple
          className="hidden"
          disabled={!canUpload}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

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
