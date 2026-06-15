import type {
  CloudAdapter,
  NormalizedFile,
  OAuthProviderConfig,
  ProviderCredentials,
} from "@/lib/adapters/types";
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

function toRemoteDir(path: string): string {
  return path === "/" ? "/" : path;
}

function toUploadDir(parentPath: string): string {
  return parentPath === "/" ? "" : parentPath;
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
    const response = await app.getRemoteDir(toRemoteDir(path));
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
    const buffer = await readStreamToBuffer(data, size, (progress) =>
      onProgress?.(Math.min(progress, 90))
    );

    const remoteDir = toUploadDir(parentPath);
    const hash = hashBuffer(buffer, app.params.is_vip);
    const uploadData = {
      remote_dir: remoteDir,
      file: filename,
      size,
      hash,
      upload_id: "",
    };

    const precreate = await app.precreateFile(uploadData);
    assertOk(precreate.errno, "precreate upload");

    if (!precreate.uploadid) {
      throw new Error("TeraBox upload initialization failed");
    }

    uploadData.upload_id = precreate.uploadid;

    if (precreate.return_type !== 2) {
      await app.getUploadHost();

      const chunkSize = getChunkSize(size, app.params.is_vip);
      for (let index = 0; index < hash.chunks.length; index++) {
        const start = index * chunkSize;
        const end = Math.min(start + chunkSize, buffer.length);
        await app.uploadChunk(uploadData, index, buffer.subarray(start, end));
        onProgress?.(
          90 + Math.round(((index + 1) / hash.chunks.length) * 10)
        );
      }
    }

    const created = await app.createFile(uploadData);
    assertOk(created.errno, "finalize upload");

    return normalizeEntry({
      fs_id: created.fs_id ?? 0,
      path: created.path ?? `${remoteDir}/${filename}`.replace("//", "/"),
      server_filename: created.server_filename ?? filename,
      isdir: 0,
      size,
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
