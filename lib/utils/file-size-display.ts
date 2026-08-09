import { formatBytes } from "@/lib/utils/format";

interface FileSizeDisplayInput {
  is_folder: boolean;
  size: number;
  child_count: number | null;
}

export function formatFileSizeLabel(
  file: FileSizeDisplayInput,
  formatItemCount: (count: number) => string
): string {
  if (!file.is_folder) return formatBytes(file.size);
  if (file.child_count == null) return "—";
  return formatItemCount(file.child_count);
}
