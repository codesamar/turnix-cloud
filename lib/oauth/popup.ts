import type { CloudProvider } from "@/lib/types/database";

export const OAUTH_MESSAGE_TYPE = "turnix-oauth";

export interface OAuthMessagePayload {
  type: typeof OAUTH_MESSAGE_TYPE;
  connected?: string;
  error?: string;
  provider?: string;
}

export function isOAuthMessage(data: unknown): data is OAuthMessagePayload {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    (data as OAuthMessagePayload).type === OAUTH_MESSAGE_TYPE
  );
}

export function buildOAuthReturnUrl(
  params: Record<string, string>,
  isPopup: boolean
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const query = new URLSearchParams(params).toString();
  const suffix = query ? `?${query}` : "";
  return isPopup ? `${appUrl}/oauth/done${suffix}` : `${appUrl}/quota${suffix}`;
}

export function openOAuthPopup(provider: CloudProvider): Window | null {
  const width = 520;
  const height = 720;
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);

  return window.open(
    `/api/accounts/${provider}/connect?popup=1`,
    `turnix-oauth-${provider}`,
    [
      "popup=yes",
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      "noopener=no",
      "noreferrer=no",
    ].join(",")
  );
}
