import { FileExplorer } from "@/components/files/file-explorer";

export default function RecentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Recent</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Files you&apos;ve recently accessed or modified
        </p>
      </div>
      <FileExplorer
        queryKey="recent"
        fetchUrl="/api/files?recent=1"
        emptyMessage="No recent files"
      />
    </div>
  );
}
