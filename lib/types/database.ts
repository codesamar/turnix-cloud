export type CloudProvider =
  | "google_drive"
  | "onedrive"
  | "dropbox"
  | "yandex"
  | "mega"
  | "pcloud"
  | "s3";

export type AccountStatus = "active" | "error" | "disconnected";
export type UploadStatus = "pending" | "uploading" | "completed" | "failed";
export type AllocationStrategy =
  | "round_robin"
  | "weighted_round_robin"
  | "least_used"
  | "most_free"
  | "manual";

export interface Profile {
  id: string;
  display_name: string | null;
  language: string;
  theme: string;
  created_at: string;
}

export interface CloudAccount {
  id: string;
  user_id: string;
  provider: CloudProvider;
  label: string;
  email: string | null;
  quota_used: number;
  quota_total: number;
  credentials_encrypted: string;
  status: AccountStatus;
  last_synced_at: string | null;
  created_at: string;
}

export interface FileMetadata {
  id: string;
  user_id: string;
  account_id: string;
  provider_file_id: string;
  name: string;
  path: string;
  mime_type: string | null;
  size: number;
  is_folder: boolean;
  is_starred: boolean;
  is_shared: boolean;
  parent_id: string | null;
  modified_at: string | null;
  synced_at: string;
}

export interface FileMetadataWithAccount extends FileMetadata {
  cloud_accounts: Pick<CloudAccount, "provider" | "label" | "email"> | null;
}

export interface UploadSession {
  id: string;
  user_id: string;
  account_id: string;
  filename: string;
  size: number;
  status: UploadStatus;
  progress: number;
  error_message: string | null;
  created_at: string;
}

export interface AllocationConfig {
  user_id: string;
  strategy: AllocationStrategy;
  weights: Record<string, number>;
  manual_order: string[];
  rotation_index: number;
}

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          display_name?: string | null;
          language?: string;
          theme?: string;
          created_at?: string;
        };
        Update: Partial<Profile>;
        Relationships: [];
      };
      cloud_accounts: {
        Row: CloudAccount;
        Insert: {
          id?: string;
          user_id: string;
          provider: CloudProvider;
          label?: string;
          email?: string | null;
          quota_used?: number;
          quota_total?: number;
          credentials_encrypted?: string;
          status?: AccountStatus;
          last_synced_at?: string | null;
          created_at?: string;
        };
        Update: Partial<CloudAccount>;
        Relationships: [];
      };
      file_metadata: {
        Row: FileMetadata;
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          provider_file_id: string;
          name: string;
          path?: string;
          mime_type?: string | null;
          size?: number;
          is_folder?: boolean;
          is_starred?: boolean;
          is_shared?: boolean;
          parent_id?: string | null;
          modified_at?: string | null;
          synced_at?: string;
        };
        Update: Partial<FileMetadata>;
        Relationships: [
          {
            foreignKeyName: "file_metadata_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "cloud_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      upload_sessions: {
        Row: UploadSession;
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          filename: string;
          size?: number;
          status?: UploadStatus;
          progress?: number;
          error_message?: string | null;
          created_at?: string;
        };
        Update: Partial<UploadSession>;
        Relationships: [];
      };
      allocation_config: {
        Row: AllocationConfig;
        Insert: {
          user_id: string;
          strategy?: AllocationStrategy;
          weights?: Json;
          manual_order?: Json;
          rotation_index?: number;
        };
        Update: Partial<AllocationConfig>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      cloud_provider: CloudProvider;
      account_status: AccountStatus;
      upload_status: UploadStatus;
      allocation_strategy: AllocationStrategy;
    };
    CompositeTypes: Record<string, never>;
  };
}
