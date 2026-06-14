"use client";

import { useCallback, useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";

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

export function UploadDropzone({ parentPath = "/", onComplete }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<ActiveUpload[]>([]);

  const uploadFile = useCallback(
    async (file: File) => {
      const initResponse = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, size: file.size }),
      });

      if (!initResponse.ok) {
        toast.error("Failed to initiate upload");
        return;
      }

      const { uploadId } = await initResponse.json();
      setUploads((prev) => [
        ...prev,
        { id: uploadId, filename: file.name, progress: 0, status: "uploading" },
      ]);

      const supabase = createClient();
      const channel = supabase
        .channel(`upload:${uploadId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "upload_sessions",
            filter: `id=eq.${uploadId}`,
          },
          (payload) => {
            const session = payload.new as { progress: number; status: string };
            setUploads((prev) =>
              prev.map((u) =>
                u.id === uploadId
                  ? { ...u, progress: session.progress, status: session.status }
                  : u
              )
            );
            if (session.status === "completed") {
              toast.success(`Uploaded ${file.name}`);
              onComplete?.();
            }
            if (session.status === "failed") {
              toast.error(`Failed to upload ${file.name}`);
            }
          }
        )
        .subscribe();

      try {
        const response = await fetch("/api/uploads", {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "x-upload-id": uploadId,
            "x-parent-path": parentPath,
            "Content-Length": String(file.size),
          },
          body: file,
        });

        if (!response.ok) {
          toast.error(`Upload failed: ${file.name}`);
        }
      } finally {
        supabase.removeChannel(channel);
      }
    },
    [parentPath, onComplete]
  );

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      Array.from(fileList).forEach((file) => uploadFile(file));
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
          <div className="flex justify-between text-sm">
            <span className="truncate">{upload.filename}</span>
            <span className="text-muted-foreground">{upload.progress}%</span>
          </div>
          <Progress value={upload.progress} />
        </div>
      ))}
    </div>
  );
}
