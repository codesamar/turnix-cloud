import type { CloudProvider } from "@/lib/types/database";

export interface NormalizedFile {
  providerFileId: string;
  name: string;
  path: string;
  mimeType: string | null;
  size: number;
  isFolder: boolean;
  isStarred: boolean;
  isShared: boolean;
  /** Immediate children count for folders; null when unknown. */
  childCount?: number | null;
  parentProviderId: string | null;
  modifiedAt: Date | null;
}

export interface QuotaInfo {
  used: number;
  total: number;
}

export interface ProviderCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  email?: string;
  accountId?: string;
  extra?: Record<string, string>;
}

export interface ListFilesOptions {
  /** Cap Graph/API pagination during folder browse (sync omits this for full tree walk). */
  maxPages?: number;
}

export interface CloudAdapter {
  provider: CloudProvider;
  listFiles(
    credentials: ProviderCredentials,
    path: string,
    options?: ListFilesOptions
  ): Promise<NormalizedFile[]>;
  /** Resolve a child item by parent path/id and name (used when stored provider IDs are stale). */
  getFileInParent?(
    credentials: ProviderCredentials,
    parentPath: string,
    name: string
  ): Promise<NormalizedFile>;
  /** Search the drive for items matching a query (exact name filtering is caller responsibility). */
  searchByName?(
    credentials: ProviderCredentials,
    name: string
  ): Promise<NormalizedFile[]>;
  /** Resolve an item by drive-root-relative path segments, e.g. ["Gambar", "Rol Kamera", "photo.jpg"]. */
  getFileByDrivePath?(
    credentials: ProviderCredentials,
    pathSegments: string[]
  ): Promise<NormalizedFile>;
  /** Paginate folder children until a matching name is found (for large folders). */
  findChildByName?(
    credentials: ProviderCredentials,
    parentPath: string,
    childName: string,
    options?: { isFolder?: boolean; maxPages?: number }
  ): Promise<NormalizedFile | null>;
  getFile(
    credentials: ProviderCredentials,
    fileId: string
  ): Promise<NormalizedFile>;
  createFolder(
    credentials: ProviderCredentials,
    parentPath: string,
    name: string
  ): Promise<NormalizedFile>;
  rename(
    credentials: ProviderCredentials,
    fileId: string,
    newName: string
  ): Promise<void>;
  move(
    credentials: ProviderCredentials,
    fileId: string,
    destinationParentPath: string
  ): Promise<NormalizedFile>;
  deleteFile(credentials: ProviderCredentials, fileId: string): Promise<void>;
  download(
    credentials: ProviderCredentials,
    fileId: string
  ): Promise<{ stream: ReadableStream<Uint8Array>; mimeType: string; name: string }>;
  upload(
    credentials: ProviderCredentials,
    parentPath: string,
    filename: string,
    data: ReadableStream<Uint8Array>,
    size: number,
    onProgress?: (progress: number) => void
  ): Promise<NormalizedFile>;
  getQuota(credentials: ProviderCredentials): Promise<QuotaInfo>;
  refreshToken(
    credentials: ProviderCredentials,
    config?: OAuthProviderConfig
  ): Promise<ProviderCredentials>;
  getAuthUrl(state: string, config: OAuthProviderConfig): string;
  exchangeCode(code: string, config: OAuthProviderConfig): Promise<ProviderCredentials>;
}

export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  extra?: Record<string, string>;
}
