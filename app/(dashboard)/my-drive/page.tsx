import { Suspense } from "react";
import { MyDriveView } from "@/components/files/my-drive-view";
import DashboardLoading from "../loading";

export default function MyDrivePage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <MyDriveView />
    </Suspense>
  );
}
