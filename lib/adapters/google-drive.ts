import type {
  CloudAdapter,
  NormalizedFile,
  OAuthProviderConfig,
  ProviderCredentials,
  QuotaInfo,
} from "@/lib/adapters/types";

const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/userinfo.email",
];

function getConfig(config: OAuthProviderConfig) {
  return config;
}

function normalizeFile(item: Record<string, unknown>): NormalizedFile {
  const parents = item.parents as string[] | undefined;
  return {
    providerFileId: item.id as string,
    name: item.name as string,
    path: "/",
    mimeType: (item.mimeType as string) ?? null,
    size: Number(item.size ?? 0),
    isFolder: item.mimeType === "application/vnd.google-apps.folder",
    isStarred: Boolean(item.starred),
    isShared: Boolean(item.shared),
    parentProviderId: parents?.[0] ?? null,
    modifiedAt: item.modifiedTime
      ? new Date(item.modifiedTime as string)
      : null,
  };
}

async function driveFetch(
  credentials: ProviderCredentials,
  path: string,
  init?: RequestInit
) {
  const response = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Drive API error: ${response.status} ${body}`);
  }

  return response;
}

export const googleDriveAdapter: CloudAdapter = {
  provider: "google_drive",

  getAuthUrl(state: string, config: OAuthProviderConfig) {
    const { clientId, redirectUri } = getConfig(config);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: SCOPES.join(" "),
      access_type: "offline",
      prompt: "consent select_account",
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  },

  async exchangeCode(code: string, config: OAuthProviderConfig) {
    const { clientId, clientSecret, redirectUri } = getConfig(config);
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to exchange Google OAuth code");
    }

    const data = await response.json();
    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${data.access_token}` } }
    );
    const profile = profileRes.ok ? await profileRes.json() : {};

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      email: profile.email,
    };
  },

  async refreshToken(credentials: ProviderCredentials, config: OAuthProviderConfig) {
    if (!credentials.refreshToken) {
      throw new Error("No refresh token available");
    }
    const { clientId, clientSecret } = getConfig(config);
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: credentials.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh Google token");
    }

    const data = await response.json();
    return {
      ...credentials,
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
  },

  async listFiles(credentials, path) {
    const folderId = path === "/" ? "root" : path;
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields:
        "files(id,name,mimeType,size,modifiedTime,starred,shared,parents)",
      pageSize: "100",
      orderBy: "folder,name",
    });
    const response = await driveFetch(credentials, `/files?${params}`);
    const data = await response.json();
    return (data.files ?? []).map(normalizeFile);
  },

  async getFile(credentials, fileId) {
    const response = await driveFetch(
      credentials,
      `/files/${fileId}?fields=id,name,mimeType,size,modifiedTime,starred,shared,parents`
    );
    return normalizeFile(await response.json());
  },

  async createFolder(credentials, parentPath, name) {
    const parentId = parentPath === "/" ? "root" : parentPath;
    const response = await driveFetch(credentials, "/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      }),
    });
    return normalizeFile(await response.json());
  },

  async rename(credentials, fileId, newName) {
    await driveFetch(credentials, `/files/${fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
  },

  async deleteFile(credentials, fileId) {
    await driveFetch(credentials, `/files/${fileId}`, { method: "DELETE" });
  },

  async download(credentials, fileId) {
    const meta = await this.getFile(credentials, fileId);
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
    );
    if (!response.ok || !response.body) {
      throw new Error("Failed to download file");
    }
    return {
      stream: response.body,
      mimeType: meta.mimeType ?? "application/octet-stream",
      name: meta.name,
    };
  },

  async upload(credentials, parentPath, filename, data, size, onProgress) {
    const parentId = parentPath === "/" ? "root" : parentPath;
    const metadata = {
      name: filename,
      parents: [parentId],
    };

    const boundary = "turnix_boundary";
    const metaPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
    const fileHeader = `--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`;

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

    const fileData = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    const body = Buffer.concat([
      Buffer.from(metaPart),
      Buffer.from(fileHeader),
      fileData,
      Buffer.from(`\r\n--${boundary}--`),
    ]);

    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,starred,shared,parents",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upload to Google Drive");
    }

    return normalizeFile(await response.json());
  },

  async getQuota(credentials) {
    const response = await driveFetch(
      credentials,
      "/about?fields=storageQuota,user"
    );
    const data = await response.json();
    const quota = data.storageQuota ?? {};
    return {
      used: Number(quota.usage ?? 0),
      total: Number(quota.limit ?? 0),
    };
  },
};
