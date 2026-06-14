export type PreviewKind = "image" | "pdf" | "text" | "video" | "audio" | "unsupported";

const TEXT_MIME_PREFIXES = ["text/", "application/json", "application/xml", "application/javascript"];
const TEXT_EXTENSIONS = [".txt", ".md", ".csv", ".json", ".xml", ".js", ".ts", ".tsx", ".jsx", ".css", ".html", ".log", ".yaml", ".yml"];

export function getPreviewKind(
  mimeType: string | null | undefined,
  filename: string
): PreviewKind {
  const mime = mimeType?.toLowerCase() ?? "";
  const lowerName = filename.toLowerCase();

  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";

  if (
    TEXT_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix)) ||
    TEXT_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
  ) {
    return "text";
  }

  if (mime.startsWith("application/vnd.google-apps.")) {
    if (mime === "application/vnd.google-apps.drawing") return "image";
    if (
      mime === "application/vnd.google-apps.document" ||
      mime === "application/vnd.google-apps.spreadsheet" ||
      mime === "application/vnd.google-apps.presentation"
    ) {
      return "pdf";
    }
  }

  return "unsupported";
}

export function canPreviewFile(
  mimeType: string | null | undefined,
  filename: string
): boolean {
  return getPreviewKind(mimeType, filename) !== "unsupported";
}
