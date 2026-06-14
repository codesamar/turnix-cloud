"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { OAUTH_MESSAGE_TYPE } from "@/lib/oauth/popup";

export function OAuthDoneClient() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const payload = {
      type: OAUTH_MESSAGE_TYPE,
      connected: searchParams.get("connected") ?? undefined,
      error: searchParams.get("error") ?? undefined,
      provider: searchParams.get("provider") ?? undefined,
    };

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(payload, window.location.origin);
    }

    const timer = window.setTimeout(() => {
      window.close();
    }, 400);

    return () => window.clearTimeout(timer);
  }, [searchParams]);

  const connected = searchParams.get("connected");
  const error = searchParams.get("error");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background p-6 text-center">
      {connected && !error ? (
        <>
          <p className="text-lg font-medium">Account connected</p>
          <p className="text-sm text-muted-foreground">
            Closing this window. Return to TurnixCloud.
          </p>
        </>
      ) : (
        <>
          <p className="text-lg font-medium">Connection failed</p>
          <p className="text-sm text-muted-foreground">
            {error ?? "Unknown error"}. Closing this window.
          </p>
        </>
      )}
    </div>
  );
}
