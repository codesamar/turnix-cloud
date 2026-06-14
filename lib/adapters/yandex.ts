import type { CloudAdapter, ProviderCredentials } from "@/lib/adapters/types";
import { getAppUrl } from "@/lib/adapters/config";

function getConfig() {
  const clientId = process.env.YANDEX_CLIENT_ID;
  const clientSecret = process.env.YANDEX_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Yandex OAuth credentials not configured");
  }
  return {
    clientId,
    clientSecret,
    redirectUri: `${getAppUrl()}/api/accounts/yandex/callback`,
  };
}

function normalizeItem(item: Record<string, unknown>) {
  return {
    providerFileId: item.path as string,
    name: item.name as string,
    path: item.path as string,
    mimeType: item.mime_type as string | null,
    size: Number(item.size ?? 0),
    isFolder: item.type === "dir",
    isStarred: false,
    isShared: false,
    parentProviderId: null,
    modifiedAt: item.modified ? new Date(item.modified as string) : null,
  };
}

async function yandexFetch(
  credentials: ProviderCredentials,
  path: string,
  init?: RequestInit
) {
  const response = await fetch(`https://cloud-api.yandex.net/v1/disk/resources${path}`, {
    ...init,
    headers: {
      Authorization: `OAuth ${credentials.accessToken}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Yandex Disk API error: ${response.status}`);
  }
  return response;
}

export const yandexAdapter: CloudAdapter = {
  provider: "yandex",

  getAuthUrl(state: string) {
    const { clientId, redirectUri } = getConfig();
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
    });
    return `https://oauth.yandex.com/authorize?${params}`;
  },

  async exchangeCode(code: string) {
    const { clientId, clientSecret } = getConfig();
    const response = await fetch("https://oauth.yandex.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    if (!response.ok) throw new Error("Failed to exchange Yandex OAuth code");
    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
  },

  async refreshToken(credentials) {
    if (!credentials.refreshToken) throw new Error("No refresh token");
    const { clientId, clientSecret } = getConfig();
    const response = await fetch("https://oauth.yandex.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: credentials.refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    if (!response.ok) throw new Error("Failed to refresh Yandex token");
    const data = await response.json();
    return {
      ...credentials,
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
  },

  async listFiles(credentials, path) {
    const diskPath = path === "/" ? "" : path;
    const response = await yandexFetch(
      credentials,
      `?path=${encodeURIComponent(diskPath || "/")}&limit=100`
    );
    const data = await response.json();
    return (data._embedded?.items ?? []).map(normalizeItem);
  },

  async getFile(credentials, fileId) {
    const response = await yandexFetch(
      credentials,
      `?path=${encodeURIComponent(fileId)}`
    );
    return normalizeItem(await response.json());
  },

  async createFolder(credentials, parentPath, name) {
    const base = parentPath === "/" ? "" : parentPath;
    const path = `${base}/${name}`.replace("//", "/") || `/${name}`;
    await yandexFetch(credentials, `?path=${encodeURIComponent(path)}`, {
      method: "PUT",
    });
    return this.getFile(credentials, path);
  },

  async rename(credentials, fileId, newName) {
    const meta = await this.getFile(credentials, fileId);
    const parent = meta.path.substring(0, meta.path.lastIndexOf("/"));
    const newPath = `${parent}/${newName}`.replace("//", "/");
    await fetch("https://cloud-api.yandex.net/v1/disk/resources/move", {
      method: "POST",
      headers: {
        Authorization: `OAuth ${credentials.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: meta.path, path: newPath }),
    });
  },

  async deleteFile(credentials, fileId) {
    await yandexFetch(credentials, `?path=${encodeURIComponent(fileId)}`, {
      method: "DELETE",
    });
  },

  async download(credentials, fileId) {
    const meta = await this.getFile(credentials, fileId);
    const linkRes = await yandexFetch(
      credentials,
      `/download?path=${encodeURIComponent(fileId)}`
    );
    const { href } = await linkRes.json();
    const response = await fetch(href);
    if (!response.ok || !response.body) throw new Error("Download failed");
    return {
      stream: response.body,
      mimeType: meta.mimeType ?? "application/octet-stream",
      name: meta.name,
    };
  },

  async upload(credentials, parentPath, filename, data, size, onProgress) {
    const base = parentPath === "/" ? "" : parentPath;
    const path = `${base}/${filename}`.replace("//", "/") || `/${filename}`;
    const linkRes = await yandexFetch(
      credentials,
      `/upload?path=${encodeURIComponent(path)}&overwrite=true`
    );
    const { href } = await linkRes.json();

    const reader = data.getReader();
    const chunks: Uint8Array[] = [];
    let uploaded = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      uploaded += value.length;
      onProgress?.(Math.round((uploaded / size) * 100));
    }
    const body = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    const response = await fetch(href, { method: "PUT", body });
    if (!response.ok) throw new Error("Upload failed");
    return this.getFile(credentials, path);
  },

  async getQuota(credentials) {
    const response = await fetch("https://cloud-api.yandex.net/v1/disk/", {
      headers: { Authorization: `OAuth ${credentials.accessToken}` },
    });
    const data = await response.json();
    return { used: Number(data.used_space ?? 0), total: Number(data.total_space ?? 0) };
  },
};
