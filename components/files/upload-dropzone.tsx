"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface UploadDropzoneProps {
  parentPath?: string;
  onComplete?: () => void;
}

interface ActiveUpload {
  id: string;
  filename: string;
  progress: number;
  status: string;
}

interface UploadSessionStatus {
  progress: number;
  status: string;
  error_message?: string | null;
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
      const sentProgress = Math.round((event.loaded / event.total) * 45);
      onProgress(sentProgress);
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
        // ignore parse errors
      }
      reject(new Error(message));
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

    xhr.send(file);
  });
}

export function UploadDropzone({ parentPath = "/", onComplete }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<ActiveUpload[]>([]);
  const pollTimersRef = useRef<Map<string, number>>(new Map());

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

      const { uploadId } = (await initResponse.json()) as { uploadId: string };

      setUploads((prev) => [
        ...prev,
        { id: uploadId, filename: file.name, progress: 0, status: "pending" },
      ]);

      startPolling(uploadId);

      try {
        await uploadFileWithProgress(uploadId, file, parentPath, (progress) => {
          updateUpload(uploadId, { progress, status: "uploading" });
        });

        const session = await fetchUploadStatus(uploadId);
        if (session?.status === "failed") {
          throw new Error(session.error_message ?? "Upload failed");
        }

        updateUpload(uploadId, { progress: 100, status: "completed" });
        stopPolling(uploadId);
        toast.success(`Uploaded ${file.name}`);
        onComplete?.();

        window.setTimeout(() => {
          setUploads((prev) => prev.filter((upload) => upload.id !== uploadId));
        }, 3000);
      } catch (err) {
        stopPolling(uploadId);
        const message = err instanceof Error ? err.message : "Upload failed";
        updateUpload(uploadId, { status: "failed", progress: 0 });
        toast.error(`${file.name}: ${message}`);
      }
    },
    [onComplete, parentPath, startPolling, stopPolling, updateUpload]
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

  return (
    <div className="space-y-3">
      <label
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <Upload className="size-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium">Drop files here or click to upload</p>
        <p className="text-xs text-muted-foreground mt-1">
          Files are allocated across your connected accounts
        </p>
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {uploads.map((upload) => (
        <div key={upload.id} className="space-y-1">
          <div className="flex justify-between text-sm gap-2">
            <span className="truncate">{upload.filename}</span>
            <span className="text-muted-foreground shrink-0">
              {upload.status === "failed"
                ? "Failed"
                : upload.status === "completed"
                  ? "Done"
                  : `${upload.progress}%`}
            </span>
          </div>
          <Progress
            value={upload.status === "completed" ? 100 : upload.progress}
            className={upload.status === "failed" ? "opacity-50" : undefined}
          />
        </div>
      ))}
    </div>
  );
}
