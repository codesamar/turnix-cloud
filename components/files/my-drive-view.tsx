"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileExplorer } from "@/components/files/file-explorer";
import { UploadDropzone } from "@/components/files/upload-dropzone";
import type { FileMetadata } from "@/lib/types/database";

export function MyDriveView() {
  const queryClient = useQueryClient();
  const [breadcrumbs, setBreadcrumbs] = useState<FileMetadata[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FileMetadata | null>(null);

  const fetchUrl = currentFolder
    ? `/api/files?parentId=${currentFolder.id}`
    : "/api/files";

  function handleNavigate(folder: FileMetadata) {
    setBreadcrumbs((prev) => [...prev, folder]);
    setCurrentFolder(folder);
  }

  function handleBreadcrumbClick(index: number) {
    if (index === -1) {
      setBreadcrumbs([]);
      setCurrentFolder(null);
      return;
    }
    setBreadcrumbs((prev) => {
      const next = prev.slice(0, index + 1);
      setCurrentFolder(next[index] ?? null);
      return next;
    });
  }

  function handleUploadComplete() {
    queryClient.invalidateQueries({ queryKey: ["my-drive"] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">My Drive</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Browse and manage files across all connected accounts
        </p>
      </div>
      <UploadDropzone
        parentPath={currentFolder?.provider_file_id ?? "/"}
        folderName={currentFolder?.name ?? null}
        onComplete={handleUploadComplete}
      />
      <FileExplorer
        queryKey="my-drive"
        fetchUrl={fetchUrl}
        onNavigate={handleNavigate}
        breadcrumbs={breadcrumbs}
        onBreadcrumbClick={handleBreadcrumbClick}
        emptyMessage="No files yet. Connect an account and sync, or upload files."
      />
    </div>
  );
}
