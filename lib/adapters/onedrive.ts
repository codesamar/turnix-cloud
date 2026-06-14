import type {
  CloudAdapter,
  NormalizedFile,
  OAuthProviderConfig,
  ProviderCredentials,
} from "@/lib/adapters/types";

const SCOPES = [
  "offline_access",
  "Files.ReadWrite.All",
  "User.Read",
];

function getConfig(config: OAuthProviderConfig) {
  return {
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    tenantId: config.extra?.tenantId ?? "common",
    redirectUri: config.redirectUri,
  };
}

function normalizeItem(item: Record<string, unknown>): NormalizedFile {
  const folder = item.folder !== undefined;
  return {
    providerFileId: item.id as string,
    name: item.name as string,
    path: "/",
    mimeType: folder ? "application/vnd.onedrive.folder" : null,
    size: Number(item.size ?? 0),
    isFolder: folder,
    isStarred: false,
    isShared: Boolean(item.shared),
    parentProviderId: null,
    modifiedAt: item.lastModifiedDateTime
      ? new Date(item.lastModifiedDateTime as string)
      : null,
  };
}

async function graphFetch(
  credentials: ProviderCredentials,
  path: string,
  init?: RequestInit
) {
  const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Microsoft Graph error: ${response.status} ${body}`);
  }

  return response;
}

export const oneDriveAdapter: CloudAdapter = {
  provider: "onedrive",

  getAuthUrl(state: string, config: OAuthProviderConfig) {
    const { clientId, redirectUri, tenantId } = getConfig(config);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: SCOPES.join(" "),
      state,
    });
    return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params}`;
  },

  async exchangeCode(code: string, config: OAuthProviderConfig) {
    const { clientId, clientSecret, redirectUri, tenantId } = getConfig(config);
    const response = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to exchange OneDrive OAuth code");
    }

    const data = await response.json();
    const profileRes = await graphFetch(
      { accessToken: data.access_token },
      "/me"
    );
    const profile = await profileRes.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      email: profile.mail ?? profile.userPrincipalName,
    };
  },

  async refreshToken(credentials: ProviderCredentials, config: OAuthProviderConfig) {
    if (!credentials.refreshToken) {
      throw new Error("No refresh token available");
    }
    const { clientId, clientSecret, redirectUri, tenantId } = getConfig(config);
    const response = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: credentials.refreshToken,
          redirect_uri: redirectUri,
          grant_type: "refresh_token",
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to refresh OneDrive token");
    }

    const data = await response.json();
    return {
      ...credentials,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? credentials.refreshToken,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
  },

  async listFiles(credentials, path) {
    const endpoint =
      path === "/"
        ? "/me/drive/root/children"
        : `/me/drive/items/${path}/children`;
    const response = await graphFetch(credentials, endpoint);
    const data = await response.json();
    return (data.value ?? []).map(normalizeItem);
  },

  async getFile(credentials, fileId) {
    const response = await graphFetch(credentials, `/me/drive/items/${fileId}`);
    return normalizeItem(await response.json());
  },

  async createFolder(credentials, parentPath, name) {
    const endpoint =
      parentPath === "/"
        ? "/me/drive/root/children"
        : `/me/drive/items/${parentPath}/children`;
    const response = await graphFetch(credentials, endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        folder: {},
        "@microsoft.graph.conflictBehavior": "rename",
      }),
    });
    return normalizeItem(await response.json());
  },

  async rename(credentials, fileId, newName) {
    await graphFetch(credentials, `/me/drive/items/${fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
  },

  async deleteFile(credentials, fileId) {
    await graphFetch(credentials, `/me/drive/items/${fileId}`, {
      method: "DELETE",
    });
  },

  async download(credentials, fileId) {
    const meta = await this.getFile(credentials, fileId);
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
      { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
    );
    if (!response.ok || !response.body) {
      throw new Error("Failed to download file");
    }
    return {
      stream: response.body,
      mimeType: "application/octet-stream",
      name: meta.name,
    };
  },

  async upload(credentials, parentPath, filename, data, size, onProgress) {
    const endpoint =
      parentPath === "/"
        ? `/me/drive/root:/${encodeURIComponent(filename)}:/content`
        : `/me/drive/items/${parentPath}:/${encodeURIComponent(filename)}:/content`;

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
    const response = await fetch(
      `https://graph.microsoft.com/v1.0${endpoint}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          "Content-Type": "application/octet-stream",
        },
        body,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upload to OneDrive");
    }

    return normalizeItem(await response.json());
  },

  async getQuota(credentials) {
    const response = await graphFetch(credentials, "/me/drive");
    const data = await response.json();
    const quota = data.quota ?? {};
    return {
      used: Number(quota.used ?? 0),
      total: Number(quota.total ?? 0),
    };
  },
};
