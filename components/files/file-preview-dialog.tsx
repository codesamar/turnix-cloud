"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBytes } from "@/lib/utils/format";
import { getPreviewKind } from "@/lib/utils/file-preview";
import type { FileMetadata } from "@/lib/types/database";

interface FilePreviewDialogProps {
  file: FileMetadata | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_TEXT_PREVIEW_BYTES = 512 * 1024;

export function FilePreviewDialog({ file, open, onOpenChange }: FilePreviewDialogProps) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textError, setTextError] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);

  const previewUrl = file ? `/api/files/${file.id}/preview` : "";
  const downloadUrl = file ? `/api/files/${file.id}/download` : "";
  const previewKind = file ? getPreviewKind(file.mime_type, file.name) : "unsupported";

  useEffect(() => {
    if (!open || !file || previewKind !== "text") {
      setTextContent(null);
      setTextError(null);
      return;
    }

    if (file.size > MAX_TEXT_PREVIEW_BYTES) {
      setTextError("File too large to preview. Please download instead.");
      return;
    }

    let cancelled = false;
    setIsLoadingText(true);
    setTextError(null);

    fetch(previewUrl)
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load file preview");
        const text = await response.text();
        if (!cancelled) setTextContent(text);
      })
      .catch((err) => {
        if (!cancelled) {
          setTextError(err instanceof Error ? err.message : "Failed to load preview");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingText(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, file, previewKind, previewUrl]);

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{file.name}</DialogTitle>
          <DialogDescription>
            {file.mime_type ?? "Unknown type"}
            {!file.is_folder && file.size > 0 ? ` · ${formatBytes(file.size)}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-[240px] max-h-[60vh] overflow-auto rounded-md border bg-muted/30">
          {previewKind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={file.name}
              className="mx-auto max-h-[58vh] w-auto object-contain p-4"
            />
          )}

          {previewKind === "pdf" && (
            <iframe
              src={previewUrl}
              title={file.name}
              className="h-[58vh] w-full border-0 bg-background"
            />
          )}

          {previewKind === "video" && (
            <video src={previewUrl} controls className="mx-auto max-h-[58vh] w-full p-4">
              <track kind="captions" />
            </video>
          )}

          {previewKind === "audio" && (
            <div className="flex min-h-[240px] items-center justify-center p-8">
              <audio src={previewUrl} controls className="w-full max-w-lg">
                <track kind="captions" />
              </audio>
            </div>
          )}

          {previewKind === "text" && (
            <div className="p-4">
              {isLoadingText && (
                <p className="text-sm text-muted-foreground">Loading preview...</p>
              )}
              {textError && <p className="text-sm text-destructive">{textError}</p>}
              {textContent !== null && (
                <pre className="whitespace-pre-wrap break-words text-xs font-mono">
                  {textContent}
                </pre>
              )}
            </div>
          )}

          {previewKind === "unsupported" && (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Preview is not available for this file type.
              </p>
              <Button asChild>
                <a href={downloadUrl}>
                  <Download className="size-4 mr-2" />
                  Download file
                </a>
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={downloadUrl}>
              <Download className="size-4 mr-2" />
              Download
            </a>
          </Button>
          {previewKind !== "unsupported" && (
            <Button asChild variant="outline" size="sm">
              <a href={previewUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4 mr-2" />
                Open in new tab
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
