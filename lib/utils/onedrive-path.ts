const FOLDER_NAME_ALIASES: Record<string, string[]> = {
  Gambar: ["Gambar", "Pictures", "Picture", "Photos"],
  Pictures: ["Pictures", "Gambar", "Picture", "Photos"],
  "Rol Kamera": ["Rol Kamera", "Camera Roll", "Camera roll", "Rol kamera"],
  "Camera Roll": ["Camera Roll", "Rol Kamera", "Camera roll"],
};

function segmentAliases(segment: string): string[] {
  return FOLDER_NAME_ALIASES[segment] ?? [segment];
}

/** Generate path segment combinations for localized / renamed OneDrive folders. */
export function generateDrivePathVariants(segments: string[]): string[][] {
  if (segments.length === 0) return [[]];

  const [head, ...tail] = segments;
  const tailVariants = generateDrivePathVariants(tail);
  const headOptions = segmentAliases(head!);
  const variants: string[][] = [];

  for (const headOption of headOptions) {
    for (const tailVariant of tailVariants) {
      variants.push([headOption, ...tailVariant]);
    }
  }

  const seen = new Set<string>();
  return variants.filter((variant) => {
    const key = variant.join("\0");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 32);
}
