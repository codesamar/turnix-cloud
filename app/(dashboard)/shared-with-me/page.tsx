import { FileExplorer } from "@/components/files/file-explorer";

export default function SharedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Shared with Me</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Files shared with you from connected providers
        </p>
      </div>
      <FileExplorer
        queryKey="shared"
        fetchUrl="/api/files?shared=1"
        emptyMessage="No shared files"
      />
    </div>
  );
}
