import type { QueryClient } from "@tanstack/react-query";

const FILE_QUERY_KEYS = [
  "my-drive",
  "recent",
  "home-recent",
  "starred",
  "shared",
  "files",
  "move-folders",
] as const;

export function invalidateFileQueries(queryClient: QueryClient) {
  for (const key of FILE_QUERY_KEYS) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
}
