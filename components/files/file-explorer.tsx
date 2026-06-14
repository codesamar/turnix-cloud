"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Download,
  Eye,
  File,
  Folder,
  MoreHorizontal,
  Star,
  Trash2,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBytes } from "@/lib/utils/format";
import type { FileMetadata, FileMetadataWithAccount } from "@/lib/types/database";
import { getFileAccountLabel } from "@/lib/utils/account-display";
import { FilePreviewDialog } from "@/components/files/file-preview-dialog";

interface FileExplorerProps {
  queryKey: string;
  fetchUrl: string;
  showProvider?: boolean;
  emptyMessage?: string;
  onNavigate?: (folder: FileMetadata) => void;
  breadcrumbs?: FileMetadata[];
  onBreadcrumbClick?: (index: number) => void;
}

async function fetchFiles(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch files");
  const data = await response.json();
  return data.files as FileMetadataWithAccount[];
}

export function FileExplorer({
  queryKey,
  fetchUrl,
  showProvider = true,
  emptyMessage = "No files found",
  onNavigate,
  breadcrumbs,
  onBreadcrumbClick,
}: FileExplorerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<FileMetadata | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: files = [], isLoading, refetch } = useQuery({
    queryKey: [queryKey, fetchUrl],
    queryFn: () => fetchFiles(fetchUrl),
  });

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  async function handleStar(file: FileMetadata) {
    await fetch(`/api/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "star", starred: !file.is_starred }),
    });
    refetch();
  }

  async function handleDelete(file: FileMetadata) {
    await fetch(`/api/files/${file.id}`, { method: "DELETE" });
    toast.success(`Deleted ${file.name}`);
    refetch();
  }

  async function handleBulkDelete() {
    await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bulk_delete", fileIds: [...selected] }),
    });
    setSelected(new Set());
    toast.success("Deleted selected files");
    refetch();
  }

  function handleRowClick(file: FileMetadata) {
    if (file.is_folder && onNavigate) {
      onNavigate(file);
      return;
    }

    if (!file.is_folder) {
      setPreviewFile(file);
      setPreviewOpen(true);
    }
  }

  function handlePreview(file: FileMetadata) {
    setPreviewFile(file);
    setPreviewOpen(true);
  }

  const columnCount = showProvider ? 6 : 5;

  return (
    <div className="space-y-4">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <button
            type="button"
            className="hover:text-foreground"
            onClick={() => onBreadcrumbClick?.(-1)}
          >
            My Drive
          </button>
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.id} className="flex items-center gap-1">
              <span>/</span>
              <button
                type="button"
                className="hover:text-foreground"
                onClick={() => onBreadcrumbClick?.(index)}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>
      )}

      {selected.size > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selected.size} selected
          </span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="size-4 mr-1" />
            Delete
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Name</TableHead>
              {showProvider && <TableHead>Account</TableHead>}
              <TableHead>Size</TableHead>
              <TableHead>Modified</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={columnCount} className="text-center py-8 text-muted-foreground">
                  Loading files...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && files.length === 0 && (
              <TableRow>
                <TableCell colSpan={columnCount} className="text-center py-8 text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
            {files.map((file) => (
              <TableRow
                key={file.id}
                className="cursor-pointer"
                onClick={() => handleRowClick(file)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selected.has(file.id)}
                    onCheckedChange={() => toggleSelect(file.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {file.is_folder ? (
                      <Folder className="size-4 text-blue-500" />
                    ) : (
                      <File className="size-4 text-muted-foreground" />
                    )}
                    <span className="truncate max-w-[300px]">{file.name}</span>
                    {file.is_starred && (
                      <Star className="size-3 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                </TableCell>
                {showProvider && (
                  <TableCell className="text-muted-foreground text-sm max-w-[220px] truncate">
                    {getFileAccountLabel(file.cloud_accounts)}
                  </TableCell>
                )}
                <TableCell className="text-muted-foreground text-sm">
                  {file.is_folder ? "—" : formatBytes(file.size)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {file.modified_at
                    ? new Date(file.modified_at).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {!file.is_folder && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title="View file"
                          onClick={() => handlePreview(file)}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title="Download"
                          asChild
                        >
                          <a href={`/api/files/${file.id}/download`}>
                            <Download className="size-4" />
                          </a>
                        </Button>
                      </>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!file.is_folder && (
                          <DropdownMenuItem onClick={() => handlePreview(file)}>
                            <Eye className="size-4 mr-2" />
                            View
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleStar(file)}>
                          <Star className="size-4 mr-2" />
                          {file.is_starred ? "Unstar" : "Star"}
                        </DropdownMenuItem>
                        {!file.is_folder && (
                          <DropdownMenuItem asChild>
                            <a href={`/api/files/${file.id}/download`}>
                              <Download className="size-4 mr-2" />
                              Download
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(file)}
                        >
                          <Trash2 className="size-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <FilePreviewDialog
        file={previewFile}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
