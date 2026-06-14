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

export interface CloudAdapter {
  provider: CloudProvider;
  listFiles(
    credentials: ProviderCredentials,
    path: string
  ): Promise<NormalizedFile[]>;
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
