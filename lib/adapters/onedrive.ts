import type {
  CloudAdapter,
  NormalizedFile,
  OAuthProviderConfig,
  ProviderCredentials,
} from "@/lib/adapters/types";

const SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "Files.ReadWrite.All",
  "User.Read",
];

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
/** Safety cap so a runaway nextLink loop cannot hang sync forever. */
const MAX_LIST_PAGES = 100;

function escapeGraphSearchQuery(value: string): string {
  return value.replace(/'/g, "''");
}

export type OneDriveSpecialFolderName = "photos" | "cameraroll";

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
  const folderFacet = item.folder as { childCount?: number } | undefined;
  const fileMeta = item.file as { mimeType?: string } | undefined;
  const parentRef = item.parentReference as { id?: string } | undefined;
  return {
    providerFileId: item.id as string,
    name: item.name as string,
    path: "/",
    mimeType: folder
      ? "application/vnd.onedrive.folder"
      : fileMeta?.mimeType ?? null,
    size: Number(item.size ?? 0),
    isFolder: folder,
    isStarred: false,
    isShared: Boolean(item.shared),
    childCount: folder ? (folderFacet?.childCount ?? null) : null,
    parentProviderId: parentRef?.id ?? null,
    modifiedAt: item.lastModifiedDateTime
      ? new Date(item.lastModifiedDateTime as string)
      : null,
  };
}

async function graphFetch(
  credentials: ProviderCredentials,
  pathOrUrl: string,
  init?: RequestInit
) {
  const url = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : `${GRAPH_BASE}${pathOrUrl}`;
  const response = await fetch(url, {
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

async function listChildrenPaginated(
  credentials: ProviderCredentials,
  firstPath: string,
  maxPages: number = MAX_LIST_PAGES
): Promise<NormalizedFile[]> {
  const items: NormalizedFile[] = [];
  let nextUrl: string | null = firstPath.startsWith("http")
    ? firstPath
    : `${GRAPH_BASE}${firstPath}`;
  let pages = 0;

  while (nextUrl && pages < maxPages) {
    const response = await graphFetch(credentials, nextUrl);
    const data = (await response.json()) as {
      value?: Record<string, unknown>[];
      "@odata.nextLink"?: string;
    };
    items.push(...(data.value ?? []).map(normalizeItem));
    nextUrl = data["@odata.nextLink"] ?? null;
    pages += 1;
  }

  if (pages >= maxPages && nextUrl) {
    console.warn(
      `[onedrive] listChildrenPaginated hit page cap (${maxPages}); some items may be missing`
    );
  }

  return items;
}

/**
 * Resolve OneDrive special folders (Photos / Camera Roll).
 * Returns null when the folder does not exist (404/403) — common for
 * Business accounts without Camera Roll.
 */
export async function getOneDriveSpecialFolder(
  credentials: ProviderCredentials,
  name: OneDriveSpecialFolderName
): Promise<NormalizedFile | null> {
  const response = await fetch(`${GRAPH_BASE}/me/drive/special/${name}`, {
    headers: { Authorization: `Bearer ${credentials.accessToken}` },
  });

  if (response.status === 404 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Microsoft Graph error: ${response.status} ${body}`);
  }

  return normalizeItem(await response.json());
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
      prompt: "select_account",
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
          scope: SCOPES.join(" "),
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      const detail =
        typeof data?.error_description === "string"
          ? data.error_description
          : typeof data?.error === "string"
            ? data.error
            : "token_exchange_failed";
      throw new Error(`OneDrive token exchange failed: ${detail}`);
    }

    if (!data.access_token) {
      throw new Error("OneDrive token exchange returned no access_token");
    }

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

  async listFiles(credentials, path, options) {
    const endpoint =
      path === "/"
        ? "/me/drive/root/children"
        : `/me/drive/items/${path}/children`;
    return listChildrenPaginated(
      credentials,
      endpoint,
      options?.maxPages ?? MAX_LIST_PAGES
    );
  },

  async getFile(credentials, fileId) {
    const response = await graphFetch(
      credentials,
      `/me/drive/items/${fileId}`
    );
    return normalizeItem(await response.json());
  },

  async getFileInParent(credentials, parentPath, name) {
    const encodedName = encodeURIComponent(name);
    const candidates =
      parentPath === "/"
        ? [`/me/drive/root:/${encodedName}`]
        : [
            `/me/drive/items/${parentPath}:/${encodedName}`,
            `/me/drive/items/${parentPath}:/${encodedName}:`,
          ];

    let lastError: unknown;
    for (const endpoint of candidates) {
      try {
        const response = await graphFetch(credentials, endpoint);
        return normalizeItem(await response.json());
      } catch (error) {
        lastError = error;
        if (!String(error).includes("404")) throw error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Microsoft Graph error: 404 itemNotFound");
  },

  async searchByName(credentials, name) {
    const query = escapeGraphSearchQuery(name);
    const items: NormalizedFile[] = [];
    let nextUrl: string | null = `/me/drive/root/search(q='${query}')`;
    let pages = 0;

    while (nextUrl && pages < 5) {
      const response = await graphFetch(credentials, nextUrl);
      const data = (await response.json()) as {
        value?: Record<string, unknown>[];
        "@odata.nextLink"?: string;
      };
      items.push(...(data.value ?? []).map(normalizeItem));
      nextUrl = data["@odata.nextLink"] ?? null;
      pages += 1;
    }

    return items;
  },

  async getFileByDrivePath(credentials, pathSegments) {
    if (pathSegments.length === 0) {
      throw new Error("Drive path is empty");
    }

    const encodedPath = pathSegments.map((segment) => encodeURIComponent(segment)).join("/");
    const candidates = [
      `/me/drive/root:/${encodedPath}`,
      `/me/drive/root:/${encodedPath}:`,
    ];

    let lastError: unknown;
    for (const endpoint of candidates) {
      try {
        const response = await graphFetch(credentials, endpoint);
        return normalizeItem(await response.json());
      } catch (error) {
        lastError = error;
        if (!String(error).includes("404")) throw error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Microsoft Graph error: 404 itemNotFound");
  },

  async findChildByName(credentials, parentPath, childName, options) {
    const maxPages = options?.maxPages ?? 80;
    const isFolder = options?.isFolder ?? false;
    const unlimited = maxPages <= 0;
    const endpoint =
      parentPath === "/"
        ? "/me/drive/root/children"
        : `/me/drive/items/${parentPath}/children`;

    let nextUrl: string | null = endpoint.startsWith("http")
      ? endpoint
      : `${GRAPH_BASE}${endpoint}`;
    let pages = 0;

    while (nextUrl && (unlimited || pages < maxPages)) {
      const response = await graphFetch(credentials, nextUrl);
      const data = (await response.json()) as {
        value?: Record<string, unknown>[];
        "@odata.nextLink"?: string;
      };

      for (const item of data.value ?? []) {
        const normalized = normalizeItem(item);
        if (normalized.name === childName && normalized.isFolder === isFolder) {
          return normalized;
        }
      }

      nextUrl = data["@odata.nextLink"] ?? null;
      pages += 1;
    }

    return null;
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

  async move(credentials, fileId, destinationParentPath) {
    let parentReference: { id: string };
    if (destinationParentPath === "/") {
      const rootResponse = await graphFetch(
        credentials,
        "/me/drive/root?$select=id"
      );
      const root = await rootResponse.json();
      parentReference = { id: root.id as string };
    } else {
      parentReference = { id: destinationParentPath };
    }

    const response = await graphFetch(
      credentials,
      `/me/drive/items/${fileId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentReference }),
      }
    );
    return normalizeItem(await response.json());
  },

  async deleteFile(credentials, fileId) {
    await graphFetch(credentials, `/me/drive/items/${fileId}`, {
      method: "DELETE",
    });
  },

  async download(credentials, fileId) {
    const meta = await this.getFile(credentials, fileId);
    const response = await fetch(
      `${GRAPH_BASE}/me/drive/items/${fileId}/content`,
      { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
    );
    if (!response.ok || !response.body) {
      throw new Error("Failed to download file");
    }
    return {
      stream: response.body,
      mimeType:
        meta.mimeType ??
        response.headers.get("Content-Type") ??
        "application/octet-stream",
      name: meta.name,
    };
  },

  async upload(credentials, parentPath, filename, data, size, onProgress) {
    // Simple PUT /content is capped at 4MB; upload sessions support larger files.
    const sessionPath =
      parentPath === "/"
        ? `/me/drive/root:/${encodeURIComponent(filename)}:/createUploadSession`
        : `/me/drive/items/${parentPath}:/${encodeURIComponent(filename)}:/createUploadSession`;

    const reader = data.getReader();
    const chunks: Uint8Array[] = [];
    let readBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      readBytes += value.length;
      if (size > 0) {
        onProgress?.(Math.min(40, Math.round((readBytes / size) * 40)));
      }
    }

    const fileData = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    const contentLength = fileData.length;

    const sessionResponse = await graphFetch(credentials, sessionPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item: {
          "@microsoft.graph.conflictBehavior": "rename",
          name: filename,
        },
      }),
    });
    const session = await sessionResponse.json();
    const uploadUrl = session.uploadUrl as string | undefined;
    if (!uploadUrl) {
      throw new Error("OneDrive upload session URL missing");
    }

    // Fragments must be multiples of 320 KiB, except the last.
    const CHUNK_SIZE = 320 * 1024 * 16; // 5 MiB
    let offset = 0;

    while (offset < contentLength) {
      const end = Math.min(offset + CHUNK_SIZE, contentLength);
      const chunk = fileData.subarray(offset, end);
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Length": String(chunk.length),
          "Content-Range": `bytes ${offset}-${end - 1}/${contentLength}`,
        },
        body: chunk,
      });

      if (end === contentLength) {
        if (!uploadResponse.ok) {
          const body = await uploadResponse.text();
          throw new Error(
            `Failed to upload to OneDrive: ${uploadResponse.status} ${body}`
          );
        }
        onProgress?.(100);
        return normalizeItem(await uploadResponse.json());
      }

      if (uploadResponse.status !== 202 && !uploadResponse.ok) {
        const body = await uploadResponse.text();
        throw new Error(
          `Failed to upload to OneDrive: ${uploadResponse.status} ${body}`
        );
      }

      offset = end;
      onProgress?.(Math.min(99, Math.round(40 + (offset / contentLength) * 60)));
    }

    throw new Error("Failed to upload to OneDrive");
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
