import type {
  CloudAdapter,
  NormalizedFile,
  OAuthProviderConfig,
  ProviderCredentials,
} from "@/lib/adapters/types";
import type { TeraBoxApp } from "terabox-api";
import { getChunkSize, hashBuffer } from "@/lib/adapters/terabox-hash";
import { createTeraboxApp } from "@/lib/adapters/terabox-client";

interface TeraboxListEntry {
  fs_id: number;
  path: string;
  server_filename: string;
  isdir: number;
  size: number;
  server_mtime?: number;
  share?: number;
}

/** Chunk uploads to CDN hosts often need longer than the library's 10s default. */
const TERABOX_UPLOAD_TIMEOUT_MS = 120_000;
const TERABOX_UPLOAD_CHUNK_RETRIES = 5;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientTeraboxUploadError(error: unknown): boolean {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 6 && current; depth++) {
    if (current instanceof Error) {
      parts.push(current.message, current.name);
      const code = (current as Error & { code?: string }).code;
      if (code) parts.push(code);
      current = current.cause;
      continue;
    }
    if (typeof current === "object" && current !== null) {
      const obj = current as { code?: string; message?: string };
      if (obj.code) parts.push(obj.code);
      if (obj.message) parts.push(obj.message);
    }
    break;
  }

  const text = parts.join(" ").toLowerCase();
  return (
    text.includes("und_err_connect_timeout") ||
    text.includes("connect timeout") ||
    text.includes("und_err_headers_timeout") ||
    text.includes("und_err_body_timeout") ||
    text.includes("econnreset") ||
    text.includes("etimedout") ||
    text.includes("socket hang up") ||
    text.includes("fetch failed") ||
    text.includes("aborted")
  );
}

async function uploadChunkWithRetry(
  app: TeraBoxApp,
  uploadData: {
    remote_dir: string;
    file: string;
    upload_id: string;
  },
  index: number,
  chunk: Blob
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= TERABOX_UPLOAD_CHUNK_RETRIES; attempt++) {
    try {
      return await app.uploadChunk(uploadData, index, chunk);
    } catch (error) {
      lastError = error;
      if (
        !isTransientTeraboxUploadError(error) ||
        attempt === TERABOX_UPLOAD_CHUNK_RETRIES
      ) {
        break;
      }
      // CDN host can change / be temporarily unreachable — refresh + backoff.
      await app.getUploadHost().catch(() => undefined);
      await sleep(1000 * attempt);
    }
  }

  const detail =
    lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(
    `TeraBox upload timed out connecting to the CDN host. Retry later or check network access to terabox.com. (${detail})`
  );
}

function toRemoteDir(path: string): string {
  return path === "/" ? "/" : path;
}

function toUploadDir(parentPath: string): string {
  if (!parentPath || parentPath === "/") return "";
  return parentPath.replace(/\/+$/, "");
}

function toRemoteFilePath(remoteDir: string, filename: string): string {
  if (!remoteDir) return `/${filename}`;
  const base = remoteDir.startsWith("/") ? remoteDir : `/${remoteDir}`;
  return `${base.replace(/\/+$/, "")}/${filename}`;
}

function normalizeEntry(entry: TeraboxListEntry): NormalizedFile {
  const isFolder = entry.isdir === 1;
  return {
    providerFileId: entry.path,
    name: entry.server_filename,
    path: entry.path,
    mimeType: isFolder ? "application/vnd.terabox.folder" : null,
    size: Number(entry.size ?? 0),
    isFolder,
    isStarred: false,
    isShared: Boolean(entry.share),
    parentProviderId: null,
    modifiedAt: entry.server_mtime
      ? new Date(entry.server_mtime * 1000)
      : null,
  };
}

function assertOk(errno: number, action: string) {
  if (errno !== 0) {
    throw new Error(`TeraBox ${action} failed (errno: ${errno})`);
  }
}

async function resolveUploadedFile(
  app: TeraBoxApp,
  remotePath: string,
  fallback: {
    filename: string;
    size: number;
    pathHint?: string;
  }
): Promise<NormalizedFile> {
  const meta = await app.getFileMeta([{ path: remotePath }]);
  if (meta.errno === 0 && meta.info?.[0]) {
    return normalizeEntry(meta.info[0]);
  }

  return normalizeEntry({
    fs_id: 0,
    path: fallback.pathHint ?? remotePath,
    server_filename: fallback.filename,
    isdir: 0,
    size: fallback.size,
  });
}

async function readStreamToBuffer(
  data: ReadableStream<Uint8Array>,
  size: number,
  onProgress?: (progress: number) => void
): Promise<Buffer> {
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

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

export const teraboxAdapter: CloudAdapter = {
  provider: "terabox",

  getAuthUrl(_state: string, _config: OAuthProviderConfig) {
    throw new Error("TeraBox uses session token connection, not OAuth");
  },

  async exchangeCode(_code: string, _config: OAuthProviderConfig) {
    throw new Error("TeraBox uses session token connection, not OAuth");
  },

  async refreshToken(credentials) {
    await createTeraboxApp(credentials);
    return credentials;
  },

  async listFiles(credentials, path) {
    const app = await createTeraboxApp(credentials);
    const remoteDir = toRemoteDir(path);
    let response = await app.getRemoteDir(remoteDir);

    if (response.errno !== 0 && remoteDir === "/") {
      response = await app.getRemoteDir("");
    }

    assertOk(response.errno, "list files");
    return (response.list ?? []).map(normalizeEntry);
  },

  async getFile(credentials, fileId) {
    const app = await createTeraboxApp(credentials);
    const response = await app.getFileMeta([{ path: fileId }]);
    assertOk(response.errno, "get file metadata");
    const entry = response.info?.[0];
    if (!entry) throw new Error("TeraBox file not found");
    return normalizeEntry(entry);
  },

  async createFolder(credentials, parentPath, name) {
    const app = await createTeraboxApp(credentials);
    const base = parentPath === "/" ? "" : parentPath;
    const dirPath = `${base}/${name}`.replace("//", "/") || `/${name}`;
    const response = await app.createDir(dirPath);
    assertOk(response.errno, "create folder");
    return normalizeEntry({
      fs_id: 0,
      path: dirPath,
      server_filename: name,
      isdir: 1,
      size: 0,
    });
  },

  async rename(credentials, fileId, newName) {
    const app = await createTeraboxApp(credentials);
    const response = await app.filemanager("rename", [
      { path: fileId, newname: newName },
    ]);
    assertOk(response.errno, "rename");
  },

  async move(credentials, fileId, destinationParentPath) {
    const app = await createTeraboxApp(credentials);
    const meta = await this.getFile(credentials, fileId);
    const dest = toUploadDir(destinationParentPath);
    const response = await app.filemanager("move", [
      { path: fileId, dest, newname: meta.name },
    ]);
    assertOk(response.errno, "move");
    const newPath = `${dest}/${meta.name}`.replace("//", "/") || `/${meta.name}`;
    return { ...meta, path: newPath, providerFileId: newPath };
  },

  async deleteFile(credentials, fileId) {
    const app = await createTeraboxApp(credentials);
    const response = await app.filemanager("delete", [fileId]);
    assertOk(response.errno, "delete");
  },

  async download(credentials, fileId) {
    const app = await createTeraboxApp(credentials);
    const metaResponse = await app.getFileMeta([{ path: fileId }]);
    assertOk(metaResponse.errno, "resolve download metadata");
    const entry = metaResponse.info?.[0];
    if (!entry) throw new Error("TeraBox file not found");

    const downloadResponse = await app.download([entry.fs_id]);
    assertOk(downloadResponse.errno, "create download link");
    const dlink = downloadResponse.dlink?.[0]?.dlink;
    if (!dlink) throw new Error("TeraBox download link unavailable");

    const response = await fetch(dlink);
    if (!response.ok || !response.body) {
      throw new Error("Failed to download file from TeraBox");
    }

    return {
      stream: response.body,
      mimeType: "application/octet-stream",
      name: entry.server_filename,
    };
  },

  async upload(credentials, parentPath, filename, data, size, onProgress) {
    const app = await createTeraboxApp(credentials);
    // Library default (10s) is too short for CDN connect + multi-MB chunks.
    app.TERABOX_TIMEOUT = TERABOX_UPLOAD_TIMEOUT_MS;

    const buffer = await readStreamToBuffer(data, size, (progress) =>
      onProgress?.(Math.min(progress, 90))
    );
    // Always use actual bytes read — mirrored metadata size can be stale/wrong.
    const actualSize = buffer.length;
    if (actualSize <= 0) {
      throw new Error("TeraBox upload failed: empty file");
    }

    const remoteDir = toUploadDir(parentPath);
    const remotePath = toRemoteFilePath(remoteDir, filename);
    const hash = hashBuffer(buffer, app.params.is_vip);
    const uploadData = {
      remote_dir: remoteDir,
      file: filename,
      size: actualSize,
      hash,
      upload_id: "",
    };

    const precreate = await app.precreateFile(uploadData);
    assertOk(precreate.errno, "precreate upload");

    // return_type 2 = identical file already on TeraBox (rapid upload).
    // Skip chunk upload + create — calling create again often yields errno 2.
    if (precreate.return_type === 2) {
      onProgress?.(100);
      return resolveUploadedFile(app, precreate.path ?? remotePath, {
        filename,
        size: actualSize,
        pathHint: precreate.path,
      });
    }

    if (!precreate.uploadid) {
      throw new Error("TeraBox upload initialization failed");
    }

    uploadData.upload_id = precreate.uploadid;

    await app.getUploadHost();

    const chunkSize = getChunkSize(actualSize, app.params.is_vip);
    for (let index = 0; index < hash.chunks.length; index++) {
      const start = index * chunkSize;
      const end = Math.min(start + chunkSize, buffer.length);
      // Node FormData.append requires Blob — Buffer is rejected at runtime.
      const chunk = new Blob([new Uint8Array(buffer.subarray(start, end))], {
        type: "application/octet-stream",
      });
      const uploaded = await uploadChunkWithRetry(
        app,
        uploadData,
        index,
        chunk
      );
      // Server MD5 is authoritative for createFile block_list.
      if (
        typeof uploaded.md5 === "string" &&
        /^[a-f0-9]{32}$/i.test(uploaded.md5)
      ) {
        hash.chunks[index] = uploaded.md5.toLowerCase();
      }
      onProgress?.(
        90 + Math.round(((index + 1) / hash.chunks.length) * 10)
      );
    }

    const created = await app.createFile(uploadData);

    // errno 2 = parameter error / already exists — recover via metadata when possible.
    if (created.errno === 2) {
      const meta = await app.getFileMeta([{ path: remotePath }]);
      if (meta.errno === 0 && meta.info?.[0]) {
        onProgress?.(100);
        return normalizeEntry(meta.info[0]);
      }
      throw new Error(
        "TeraBox finalize upload failed (errno: 2). Path/size/hash may be inconsistent — try again."
      );
    }

    assertOk(created.errno, "finalize upload");
    onProgress?.(100);

    return normalizeEntry({
      fs_id: created.fs_id ?? 0,
      path: created.path ?? remotePath,
      server_filename: created.server_filename ?? filename,
      isdir: 0,
      size: actualSize,
    });
  },

  async getQuota(credentials) {
    const app = await createTeraboxApp(credentials);
    const response = await app.getQuota();
    assertOk(response.errno, "get quota");
    return {
      used: Number(response.used ?? 0),
      total: Number(response.total ?? 0),
    };
  },
};

export { buildTeraboxCredentials } from "@/lib/adapters/terabox-client";
