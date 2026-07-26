import { Suspense } from "react";
import { MyDriveView } from "@/components/files/my-drive-view";

export default function MyDrivePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
      <MyDriveView />
    </Suspense>
  );
}
