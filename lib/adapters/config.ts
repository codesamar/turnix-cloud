import type { CloudProvider } from "@/lib/types/database";

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function getOAuthRedirectUri(provider: CloudProvider): string {
  return `${getAppUrl()}/api/accounts/${provider.replace("_", "-")}/callback`.replace(
    "google-drive",
    "google_drive"
  );
}

export const PROVIDER_LABELS: Record<CloudProvider, string> = {
  google_drive: "Google Drive",
  onedrive: "OneDrive",
  dropbox: "Dropbox",
  yandex: "Yandex Disk",
  mega: "MEGA",
  pcloud: "pCloud",
  s3: "S3 Compatible",
  terabox: "TeraBox",
};

export const CREDENTIALS_PROVIDERS: CloudProvider[] = ["s3", "terabox"];

export const OAUTH_PROVIDERS: CloudProvider[] = [
  "google_drive",
  "onedrive",
  "dropbox",
  "yandex",
];
