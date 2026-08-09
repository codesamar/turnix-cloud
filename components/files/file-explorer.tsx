"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Download,
  Eye,
  File,
  FileText,
  Folder,
  FolderInput,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Music,
  Play,
  Star,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils/format";
import type { FileMetadata, FileMetadataWithAccount } from "@/lib/types/database";
import { getFileAccountLabel } from "@/lib/utils/account-display";
import { getPreviewKind } from "@/lib/utils/file-preview";
import { FilePreviewDialog } from "@/components/files/file-preview-dialog";
import { DeleteFilesDialog } from "@/components/files/delete-files-dialog";
import { MoveFileDialog } from "@/components/files/move-file-dialog";
import { useLanguage } from "@/components/providers/language-provider";

export type ViewMode = "list" | "grid";
export type SortMode = "name-asc" | "name-desc" | "date-newest" | "date-oldest";

const VIEW_STORAGE_KEY = "samarcloud.fileView";
const SORT_STORAGE_KEY = "samarcloud.fileSort";

export const SORT_MODES: SortMode[] = [
  "name-asc",
  "name-desc",
  "date-newest",
  "date-oldest",
];

export const DEFAULT_SORT_MODE: SortMode = "name-asc";
export const DEFAULT_VIEW_MODE: ViewMode = "list";

export function parseSortMode(value: string | null | undefined): SortMode {
  return SORT_MODES.includes(value as SortMode)
    ? (value as SortMode)
    : DEFAULT_SORT_MODE;
}

export function parseViewMode(value: string | null | undefined): ViewMode {
  return value === "grid" || value === "list" ? value : DEFAULT_VIEW_MODE;
}

interface FileExplorerProps {
  queryKey: string;
  fetchUrl: string;
  showProvider?: boolean;
  emptyMessage?: string;
  onNavigate?: (folder: FileMetadata) => void;
  breadcrumbs?: FileMetadata[];
  onBreadcrumbClick?: (index: number) => void;
  /** When set with onSortModeChange, sort is controlled by the parent (e.g. URL). */
  sortMode?: SortMode;
  onSortModeChange?: (mode: SortMode) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

async function fetchFiles(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch files");
  const data = await response.json();
  return data.files as FileMetadataWithAccount[];
}

function readStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "list";
  const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
  return stored === "grid" ? "grid" : "list";
}

function readStoredSortMode(): SortMode {
  if (typeof window === "undefined") return "name-asc";
  const stored = window.localStorage.getItem(SORT_STORAGE_KEY);
  return SORT_MODES.includes(stored as SortMode)
    ? (stored as SortMode)
    : "name-asc";
}

function formatFileDate(
  value: string | null | undefined,
  language: string
): string {
  if (!value) return "—";
  const locale = language === "id" ? "id-ID" : "en-US";
  return new Date(value).toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sortFiles(
  files: FileMetadataWithAccount[],
  sortMode: SortMode
): FileMetadataWithAccount[] {
  const sorted = [...files];
  sorted.sort((a, b) => {
    if (a.is_folder !== b.is_folder) {
      return a.is_folder ? -1 : 1;
    }

    if (sortMode === "name-asc" || sortMode === "name-desc") {
      const cmp = a.name.localeCompare(b.name, undefined, {
        sensitivity: "base",
        numeric: true,
      });
      return sortMode === "name-asc" ? cmp : -cmp;
    }

    const aTime = a.modified_at ? new Date(a.modified_at).getTime() : 0;
    const bTime = b.modified_at ? new Date(b.modified_at).getTime() : 0;
    if (aTime !== bTime) {
      return sortMode === "date-newest" ? bTime - aTime : aTime - bTime;
    }
    return a.name.localeCompare(b.name, undefined, {
      sensitivity: "base",
      numeric: true,
    });
  });
  return sorted;
}

function GridMediaLoading() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
      <span className="text-xs text-muted-foreground">Loading...</span>
    </div>
  );
}

function GridFileMedia({ file }: { file: FileMetadataWithAccount }) {
  const previewKind = file.is_folder
    ? null
    : getPreviewKind(file.mime_type, file.name);
  const [mediaFailed, setMediaFailed] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);

  useEffect(() => {
    setMediaFailed(false);
    setMediaLoaded(false);
  }, [file.id]);

  if (file.is_folder) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted/50">
        <Folder className="size-14 text-blue-500" />
      </div>
    );
  }

  const previewUrl = `/api/files/${file.id}/preview`;

  if (previewKind === "image" && !mediaFailed) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {!mediaLoaded && <GridMediaLoading />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt={file.name}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-200",
            mediaLoaded ? "opacity-100" : "opacity-0"
          )}
          loading="lazy"
          onLoad={() => setMediaLoaded(true)}
          onError={() => {
            setMediaFailed(true);
            setMediaLoaded(false);
          }}
        />
      </div>
    );
  }

  if (previewKind === "video" && !mediaFailed) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {!mediaLoaded && <GridMediaLoading />}
        <video
          src={previewUrl}
          muted
          preload="metadata"
          playsInline
          className={cn(
            "h-full w-full object-cover transition-opacity duration-200",
            mediaLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoadedData={() => setMediaLoaded(true)}
          onError={() => {
            setMediaFailed(true);
            setMediaLoaded(false);
          }}
        />
        {mediaLoaded && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="flex size-10 items-center justify-center rounded-full bg-black/60 text-white">
              <Play className="size-5 fill-current" />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (previewKind === "audio") {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-muted/50">
        <Music className="size-12 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Audio</span>
      </div>
    );
  }

  if (previewKind === "pdf") {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-muted/50">
        <FileText className="size-12 text-red-500/80" />
        <span className="text-xs text-muted-foreground">PDF</span>
      </div>
    );
  }

  return (
    <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted/50">
      <File className="size-14 text-muted-foreground" />
    </div>
  );
}

function FileActionsMenu({
  file,
  onPreview,
  onStar,
  onMove,
  onDelete,
  moveLabel,
  deleteLabel,
}: {
  file: FileMetadata;
  onPreview: (file: FileMetadata) => void;
  onStar: (file: FileMetadata) => void;
  onMove: (file: FileMetadata) => void;
  onDelete: (file: FileMetadata) => void;
  moveLabel: string;
  deleteLabel: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!file.is_folder && (
          <DropdownMenuItem onClick={() => onPreview(file)}>
            <Eye className="size-4 mr-2" />
            View
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onStar(file)}>
          <Star className="size-4 mr-2" />
          {file.is_starred ? "Unstar" : "Star"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMove(file)}>
          <FolderInput className="size-4 mr-2" />
          {moveLabel}
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
          onClick={() => onDelete(file)}
        >
          <Trash2 className="size-4 mr-2" />
          {deleteLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FileExplorer({
  queryKey,
  fetchUrl,
  showProvider = true,
  emptyMessage = "No files found",
  onNavigate,
  breadcrumbs,
  onBreadcrumbClick,
  sortMode: sortModeProp,
  onSortModeChange,
  viewMode: viewModeProp,
  onViewModeChange,
}: FileExplorerProps) {
  const { t, language } = useLanguage();
  const [internalViewMode, setInternalViewMode] =
    useState<ViewMode>(DEFAULT_VIEW_MODE);
  const [internalSortMode, setInternalSortMode] =
    useState<SortMode>(DEFAULT_SORT_MODE);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<FileMetadata | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveFiles, setMoveFiles] = useState<FileMetadata[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteFiles, setDeleteFiles] = useState<FileMetadata[]>([]);

  const sortControlled = sortModeProp !== undefined;
  const viewControlled = viewModeProp !== undefined;
  const sortMode = sortControlled ? sortModeProp : internalSortMode;
  const viewMode = viewControlled ? viewModeProp : internalViewMode;

  useEffect(() => {
    if (!viewControlled) setInternalViewMode(readStoredViewMode());
    if (!sortControlled) setInternalSortMode(readStoredSortMode());
  }, [sortControlled, viewControlled]);

  useEffect(() => {
    setSelected(new Set());
  }, [fetchUrl]);

  function handleViewModeChange(value: string) {
    if (value !== "list" && value !== "grid") return;
    if (onViewModeChange) {
      onViewModeChange(value);
      return;
    }
    setInternalViewMode(value);
    window.localStorage.setItem(VIEW_STORAGE_KEY, value);
  }

  function handleSortModeChange(value: string) {
    if (!SORT_MODES.includes(value as SortMode)) return;
    const next = value as SortMode;
    if (onSortModeChange) {
      onSortModeChange(next);
      return;
    }
    setInternalSortMode(next);
    window.localStorage.setItem(SORT_STORAGE_KEY, next);
  }

  const { data: files = [], isLoading, refetch } = useQuery({
    queryKey: [queryKey, fetchUrl],
    queryFn: () => fetchFiles(fetchUrl),
  });

  const sortedFiles = useMemo(
    () => sortFiles(files, sortMode),
    [files, sortMode]
  );

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function clearSelection() {
    setSelected(new Set());
  }

  async function handleStar(file: FileMetadata) {
    await fetch(`/api/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "star", starred: !file.is_starred }),
    });
    refetch();
  }

  function openDeleteDialog(items: FileMetadata[]) {
    setDeleteFiles(items);
    setDeleteOpen(true);
  }

  function openMoveDialog(items: FileMetadata[]) {
    setMoveFiles(items);
    setMoveOpen(true);
  }

  function handleMoveComplete() {
    setSelected(new Set());
    refetch();
  }

  function handleDeleteComplete() {
    setSelected(new Set());
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
  const moveLabel = t("move.action");
  const deleteLabel = t("delete.action");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
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
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Select value={sortMode} onValueChange={handleSortModeChange}>
            <SelectTrigger
              className="w-[11.5rem]"
              aria-label={t("files.sortBy")}
              title={t("files.sortBy")}
            >
              <SelectValue placeholder={t("files.sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">{t("files.sortNameAsc")}</SelectItem>
              <SelectItem value="name-desc">{t("files.sortNameDesc")}</SelectItem>
              <SelectItem value="date-newest">
                {t("files.sortDateNewest")}
              </SelectItem>
              <SelectItem value="date-oldest">
                {t("files.sortDateOldest")}
              </SelectItem>
            </SelectContent>
          </Select>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={handleViewModeChange}
            variant="outline"
            size="sm"
            className="justify-end"
          >
            <ToggleGroupItem value="list" aria-label={t("files.viewList")} title={t("files.viewList")}>
              <List className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label={t("files.viewGrid")} title={t("files.viewGrid")}>
              <LayoutGrid className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b bg-background/95 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:-mx-6 md:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t("files.selectedCount").replace("{count}", String(selected.size))}
            </span>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              {t("files.unselectAll")}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                openMoveDialog(
                  sortedFiles.filter((file) => selected.has(file.id))
                )
              }
            >
              <FolderInput className="size-4 mr-1" />
              {moveLabel}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                openDeleteDialog(
                  sortedFiles.filter((file) => selected.has(file.id))
                )
              }
            >
              <Trash2 className="size-4 mr-1" />
              {deleteLabel}
            </Button>
          </div>
        </div>
      )}

      {viewMode === "list" ? (
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
              {!isLoading && sortedFiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columnCount} className="text-center py-8 text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
              {sortedFiles.map((file) => (
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
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {formatFileDate(file.modified_at, language)}
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
                      <FileActionsMenu
                        file={file}
                        onPreview={handlePreview}
                        onStar={handleStar}
                        onMove={(item) => openMoveDialog([item])}
                        onDelete={(file) => openDeleteDialog([file])}
                        moveLabel={moveLabel}
                        deleteLabel={deleteLabel}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div>
          {isLoading && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Loading files...
            </p>
          )}
          {!isLoading && sortedFiles.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          )}
          {!isLoading && sortedFiles.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {sortedFiles.map((file) => {
                const isSelected = selected.has(file.id);
                return (
                  <div
                    key={file.id}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border transition-colors hover:bg-muted/40",
                      isSelected && "border-primary ring-1 ring-primary/30"
                    )}
                    onClick={() => handleRowClick(file)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleRowClick(file);
                      }
                    }}
                  >
                    <div className="flex items-start gap-2 px-2.5 pb-2 pt-2">
                      <div
                        className="pt-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(file.id)}
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <span className="truncate text-sm font-medium leading-snug">
                            {file.name}
                          </span>
                          {file.is_starred && (
                            <Star className="size-3 shrink-0 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                        {showProvider && (
                          <p
                            className="break-all text-xs leading-snug text-muted-foreground"
                            title={getFileAccountLabel(file.cloud_accounts)}
                          >
                            {getFileAccountLabel(file.cloud_accounts)}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          <span>
                            {file.is_folder ? "—" : formatBytes(file.size)}
                          </span>
                          <span className="mx-1.5 text-muted-foreground/50">
                            ·
                          </span>
                          <span>
                            {formatFileDate(file.modified_at, language)}
                          </span>
                        </p>
                      </div>
                      <div
                        className="-mr-1 -mt-0.5 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FileActionsMenu
                          file={file}
                          onPreview={handlePreview}
                          onStar={handleStar}
                          onMove={(item) => openMoveDialog([item])}
                          onDelete={(file) => openDeleteDialog([file])}
                          moveLabel={moveLabel}
                          deleteLabel={deleteLabel}
                        />
                      </div>
                    </div>

                    <GridFileMedia file={file} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <FilePreviewDialog
        file={previewFile}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />

      <MoveFileDialog
        open={moveOpen}
        onOpenChange={setMoveOpen}
        files={moveFiles}
        onMoved={handleMoveComplete}
      />

      <DeleteFilesDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        files={deleteFiles}
        onDeleted={handleDeleteComplete}
      />
    </div>
  );
}
