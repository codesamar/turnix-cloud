import type {
  CloudAdapter,
  NormalizedFile,
  OAuthProviderConfig,
  ProviderCredentials,
} from "@/lib/adapters/types";

interface S3Credentials extends ProviderCredentials {
  extra: {
    endpoint: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
}

function getS3Extra(credentials: ProviderCredentials): S3Credentials["extra"] {
  if (!credentials.extra) throw new Error("S3 credentials missing");
  return credentials.extra as S3Credentials["extra"];
}

function normalizeKey(key: string, name: string, size: number, isFolder: boolean): NormalizedFile {
  return {
    providerFileId: key,
    name,
    path: key,
    mimeType: isFolder ? "application/x-directory" : null,
    size,
    isFolder,
    isStarred: false,
    isShared: false,
    parentProviderId: null,
    modifiedAt: null,
  };
}

export const s3Adapter: CloudAdapter = {
  provider: "s3",

  getAuthUrl(_state: string, _config: OAuthProviderConfig) {
    throw new Error("S3 uses access key connection, not OAuth");
  },

  async exchangeCode(_code: string, _config: OAuthProviderConfig) {
    throw new Error("S3 uses access key connection, not OAuth");
  },

  async refreshToken(credentials) {
    return credentials;
  },

  async listFiles(credentials, path) {
    const { endpoint, bucket, accessKeyId, secretAccessKey, region } =
      getS3Extra(credentials);
    const prefix = path === "/" ? "" : path.replace(/^\//, "");
    const { S3Client, ListObjectsV2Command } = await import("@aws-sdk/client-s3");

    const client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });

    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        Delimiter: "/",
      })
    );

    const files: NormalizedFile[] = [];

    for (const cp of response.CommonPrefixes ?? []) {
      if (cp.Prefix) {
        const name = cp.Prefix.replace(prefix, "").replace(/\/$/, "");
        files.push(normalizeKey(cp.Prefix, name, 0, true));
      }
    }

    for (const obj of response.Contents ?? []) {
      if (obj.Key && obj.Key !== prefix) {
        const name = obj.Key.replace(prefix, "").replace(/\/$/, "");
        if (name) {
          files.push(normalizeKey(obj.Key, name, obj.Size ?? 0, false));
        }
      }
    }

    return files;
  },

  async getFile(credentials, fileId) {
    const { bucket } = getS3Extra(credentials);
    const name = fileId.split("/").filter(Boolean).pop() ?? fileId;
    return normalizeKey(fileId, name, 0, fileId.endsWith("/"));
  },

  async createFolder(credentials, parentPath, name) {
    const base = parentPath === "/" ? "" : parentPath.replace(/^\//, "");
    const key = `${base}${base ? "/" : ""}${name}/`;
    const { endpoint, bucket, accessKeyId, secretAccessKey, region } =
      getS3Extra(credentials);
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: "" }));
    return normalizeKey(key, name, 0, true);
  },

  async rename(credentials, fileId, newName) {
    const { endpoint, bucket, accessKeyId, secretAccessKey, region } =
      getS3Extra(credentials);
    const { S3Client, CopyObjectCommand, DeleteObjectCommand } = await import(
      "@aws-sdk/client-s3"
    );
    const client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
    const parent = fileId.substring(0, fileId.lastIndexOf("/") + 1);
    const newKey = `${parent}${newName}`;
    await client.send(
      new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/${fileId}`,
        Key: newKey,
      })
    );
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: fileId }));
  },

  async move(credentials, fileId, destinationParentPath) {
    const { endpoint, bucket, accessKeyId, secretAccessKey, region } =
      getS3Extra(credentials);
    const { S3Client, CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand } =
      await import("@aws-sdk/client-s3");
    const client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });

    const meta = await this.getFile(credentials, fileId);
    const base =
      destinationParentPath === "/"
        ? ""
        : destinationParentPath.replace(/^\//, "").replace(/\/$/, "");
    const newKey = `${base}${base ? "/" : ""}${meta.name}${meta.isFolder ? "/" : ""}`;

    await client.send(
      new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/${fileId}`,
        Key: newKey,
      })
    );
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: fileId }));

    let size = meta.size;
    if (!meta.isFolder) {
      const head = await client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: newKey })
      );
      size = Number(head.ContentLength ?? 0);
    }

    return normalizeKey(newKey, meta.name, size, meta.isFolder);
  },

  async deleteFile(credentials, fileId) {
    const { endpoint, bucket, accessKeyId, secretAccessKey, region } =
      getS3Extra(credentials);
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: fileId }));
  },

  async download(credentials, fileId) {
    const { endpoint, bucket, accessKeyId, secretAccessKey, region } =
      getS3Extra(credentials);
    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
    const response = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: fileId })
    );
    if (!response.Body) throw new Error("Empty response");
    const name = fileId.split("/").pop() ?? fileId;
    return {
      stream: response.Body.transformToWebStream(),
      mimeType: response.ContentType ?? "application/octet-stream",
      name,
    };
  },

  async upload(credentials, parentPath, filename, data, size, onProgress) {
    const base = parentPath === "/" ? "" : parentPath.replace(/^\//, "");
    const key = `${base}${base ? "/" : ""}${filename}`;
    const { endpoint, bucket, accessKeyId, secretAccessKey, region } =
      getS3Extra(credentials);
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });

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

    await client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: body })
    );

    return normalizeKey(key, filename, size, false);
  },

  async getQuota(credentials) {
    const { endpoint, bucket, accessKeyId, secretAccessKey, region } =
      getS3Extra(credentials);
    const { S3Client, ListObjectsV2Command } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });

    let total = 0;
    let token: string | undefined;
    do {
      const response = await client.send(
        new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token })
      );
      for (const obj of response.Contents ?? []) {
        total += obj.Size ?? 0;
      }
      token = response.NextContinuationToken;
    } while (token);

    return { used: total, total: 0 };
  },
};
