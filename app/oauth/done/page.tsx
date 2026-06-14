import { Suspense } from "react";
import { OAuthDoneClient } from "@/components/accounts/oauth-done-client";

export default function OAuthDonePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Completing connection...
        </div>
      }
    >
      <OAuthDoneClient />
    </Suspense>
  );
}
