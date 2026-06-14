import type {
  CloudAdapter,
  NormalizedFile,
  OAuthProviderConfig,
  ProviderCredentials,
} from "@/lib/adapters/types";

function getConfig(config: OAuthProviderConfig) {
  return config;
}

function normalizeEntry(entry: Record<string, unknown>): NormalizedFile {
  const tag = entry[".tag"] as string;
  const isFolder = tag === "folder";
  return {
    providerFileId: (entry.id as string) ?? (entry.path_lower as string),
    name: entry.name as string,
    path: (entry.path_display as string) ?? "/",
    mimeType: isFolder ? "application/vnd.dropbox.folder" : null,
    size: Number(entry.size ?? 0),
    isFolder,
    isStarred: Boolean(entry.is_starred),
    isShared: Boolean(entry.sharing_info),
    parentProviderId: null,
    modifiedAt: entry.server_modified
      ? new Date(entry.server_modified as string)
      : null,
  };
}

async function dropboxRpc(
  credentials: ProviderCredentials,
  endpoint: string,
  body: object
) {
  const response = await fetch(`https://api.dropboxapi.com/2/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Dropbox API error: ${response.status} ${text}`);
  }

  return response;
}

export const dropboxAdapter: CloudAdapter = {
  provider: "dropbox",

  getAuthUrl(state: string, config: OAuthProviderConfig) {
    const { clientId, redirectUri } = getConfig(config);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      token_access_type: "offline",
      force_reauthentication: "true",
      state,
    });
    return `https://www.dropbox.com/oauth2/authorize?${params}`;
  },

  async exchangeCode(code: string, config: OAuthProviderConfig) {
    const { clientId, clientSecret, redirectUri } = getConfig(config);
    const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
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
      throw new Error("Failed to exchange Dropbox OAuth code");
    }

    const data = await response.json();
    const accountRes = await dropboxRpc(
      { accessToken: data.access_token },
      "users/get_current_account",
      {}
    );
    const account = await accountRes.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in
        ? Date.now() + data.expires_in * 1000
        : undefined,
      email: account.email,
      accountId: account.account_id,
    };
  },

  async refreshToken(credentials: ProviderCredentials, config?: OAuthProviderConfig) {
    if (!credentials.refreshToken || !config) {
      throw new Error("No refresh token available");
    }
    const { clientId, clientSecret } = getConfig(config);
    const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
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
      throw new Error("Failed to refresh Dropbox token");
    }

    const data = await response.json();
    return {
      ...credentials,
      accessToken: data.access_token,
      expiresAt: data.expires_in
        ? Date.now() + data.expires_in * 1000
        : credentials.expiresAt,
    };
  },

  async listFiles(credentials, path) {
    const dropboxPath = path === "/" ? "" : path;
    const response = await dropboxRpc(credentials, "files/list_folder", {
      path: dropboxPath,
      include_media_info: false,
      include_deleted: false,
    });
    const data = await response.json();
    return (data.entries ?? []).map(normalizeEntry);
  },

  async getFile(credentials, fileId) {
    const response = await dropboxRpc(credentials, "files/get_metadata", {
      path: fileId,
    });
    return normalizeEntry(await response.json());
  },

  async createFolder(credentials, parentPath, name) {
    const basePath = parentPath === "/" ? "" : parentPath;
    const response = await dropboxRpc(credentials, "files/create_folder_v2", {
      path: `${basePath}/${name}`.replace("//", "/") || `/${name}`,
      autorename: true,
    });
    const data = await response.json();
    return normalizeEntry(data.metadata);
  },

  async rename(credentials, fileId, newName) {
    const meta = await this.getFile(credentials, fileId);
    const parentPath = meta.path.substring(0, meta.path.lastIndexOf("/"));
    await dropboxRpc(credentials, "files/move_v2", {
      from_path: meta.path,
      to_path: `${parentPath}/${newName}`.replace("//", "/"),
    });
  },

  async move(credentials, fileId, destinationParentPath) {
    const meta = await this.getFile(credentials, fileId);
    const destFolder = destinationParentPath === "/" ? "" : destinationParentPath;
    const toPath = `${destFolder}/${meta.name}`.replace("//", "/") || `/${meta.name}`;
    const response = await dropboxRpc(credentials, "files/move_v2", {
      from_path: meta.path,
      to_path: toPath,
      autorename: true,
    });
    const data = await response.json();
    return normalizeEntry(data.metadata);
  },

  async deleteFile(credentials, fileId) {
    await dropboxRpc(credentials, "files/delete_v2", { path: fileId });
  },

  async download(credentials, fileId) {
    const meta = await this.getFile(credentials, fileId);
    const response = await fetch(
      "https://content.dropboxapi.com/2/files/download",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          "Dropbox-API-Arg": JSON.stringify({ path: meta.path }),
        },
      }
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
    const basePath = parentPath === "/" ? "" : parentPath;
    const path = `${basePath}/${filename}`.replace("//", "/") || `/${filename}`;

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
      "https://content.dropboxapi.com/2/files/upload",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          "Content-Type": "application/octet-stream",
          "Dropbox-API-Arg": JSON.stringify({
            path,
            mode: "add",
            autorename: true,
            mute: false,
          }),
        },
        body,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upload to Dropbox");
    }

    return normalizeEntry(await response.json());
  },

  async getQuota(credentials) {
    const response = await dropboxRpc(
      credentials,
      "users/get_space_usage",
      {}
    );
    const data = await response.json();
    return {
      used: Number(data.used ?? 0),
      total: Number(data.allocation?.allocated ?? 0),
    };
  },
};
