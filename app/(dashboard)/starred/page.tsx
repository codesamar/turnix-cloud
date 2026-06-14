import { FileExplorer } from "@/components/files/file-explorer";

export default function StarredPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Starred</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Your starred files across all providers
        </p>
      </div>
      <FileExplorer
        queryKey="starred"
        fetchUrl="/api/files?starred=1"
        emptyMessage="No starred files"
      />
    </div>
  );
}
