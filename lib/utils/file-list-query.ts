import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";

export type FileListSortMode =
  | "name-asc"
  | "name-desc"
  | "date-newest"
  | "date-oldest";

export const FILE_LIST_SORT_MODES: FileListSortMode[] = [
  "name-asc",
  "name-desc",
  "date-newest",
  "date-oldest",
];

export const FILE_LIST_PAGE_SIZE_GRID = 24;
export const FILE_LIST_PAGE_SIZE_LIST = 40;
export const FILE_LIST_MAX_PAGE_SIZE = 200;

export function parseFileListSort(value: string | null): FileListSortMode {
  return FILE_LIST_SORT_MODES.includes(value as FileListSortMode)
    ? (value as FileListSortMode)
    : "name-asc";
}

export function parseFileListLimit(value: string | null): number | undefined {
  if (value === null) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return FILE_LIST_PAGE_SIZE_GRID;
  return Math.min(parsed, FILE_LIST_MAX_PAGE_SIZE);
}

export function parseFileListOffset(value: string | null): number {
  if (value === null) return 0;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyFileListSort<T extends PostgrestFilterBuilder<any, any, any>>(
  query: T,
  sort: FileListSortMode
): T {
  const foldersFirst = { ascending: false as const };

  switch (sort) {
    case "name-desc":
      return query
        .order("is_folder", foldersFirst)
        .order("name", { ascending: false }) as T;
    case "date-newest":
      return query
        .order("is_folder", foldersFirst)
        .order("modified_at", { ascending: false, nullsFirst: false }) as T;
    case "date-oldest":
      return query
        .order("is_folder", foldersFirst)
        .order("modified_at", { ascending: true, nullsFirst: false }) as T;
    case "name-asc":
    default:
      return query
        .order("is_folder", foldersFirst)
        .order("name", { ascending: true }) as T;
  }
}

export function buildFilesPageUrl(
  fetchUrl: string,
  offset: number,
  limit: number,
  sort: FileListSortMode
): string {
  const [path, query = ""] = fetchUrl.split("?");
  const params = new URLSearchParams(query);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  params.set("sort", sort);
  return `${path}?${params.toString()}`;
}
