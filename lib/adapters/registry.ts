import type { CloudAdapter } from "@/lib/adapters/types";
import { googleDriveAdapter } from "@/lib/adapters/google-drive";
import { oneDriveAdapter } from "@/lib/adapters/onedrive";
import { dropboxAdapter } from "@/lib/adapters/dropbox";
import { yandexAdapter } from "@/lib/adapters/yandex";
import { s3Adapter } from "@/lib/adapters/s3";

function createStubAdapter(provider: "mega" | "pcloud"): CloudAdapter {
  const notImplemented = () => {
    throw new Error(`${provider} adapter is not yet implemented`);
  };

  return {
    provider,
    getAuthUrl: notImplemented,
    exchangeCode: notImplemented,
    refreshToken: async (c) => c,
    listFiles: notImplemented,
    getFile: notImplemented,
    createFolder: notImplemented,
    rename: notImplemented,
    deleteFile: notImplemented,
    download: notImplemented,
    upload: notImplemented,
    getQuota: async () => ({ used: 0, total: 0 }),
  };
}

const adapters: Record<string, CloudAdapter> = {
  google_drive: googleDriveAdapter,
  onedrive: oneDriveAdapter,
  dropbox: dropboxAdapter,
  yandex: yandexAdapter,
  s3: s3Adapter,
  mega: createStubAdapter("mega"),
  pcloud: createStubAdapter("pcloud"),
};

export function getAdapter(provider: string): CloudAdapter {
  const adapter = adapters[provider];
  if (!adapter) {
    throw new Error(`No adapter registered for provider: ${provider}`);
  }
  return adapter;
}

export function getSupportedProviders() {
  return Object.keys(adapters);
}

export { adapters };
