export function isProviderItemNotFound(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  return (
    lower.includes("404") ||
    lower.includes("itemnotfound") ||
    lower.includes("not found") ||
    lower.includes("not_found")
  );
}

export function providerFileNotFoundMessage(fileName: string): string {
  return `"${fileName}" was not found in the cloud. Open its folder to refresh, then try again.`;
}
