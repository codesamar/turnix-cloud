declare module "terabox-api" {
  interface TeraboxListEntry {
    fs_id: number;
    path: string;
    server_filename: string;
    isdir: number;
    size: number;
    server_mtime?: number;
    share?: number;
  }

  export class TeraBoxApp {
    constructor(authData: string, authType?: string);
    params: {
      whost: string;
      uhost: string;
      cookie: string;
      is_vip: boolean;
      account_id: number;
      account_name: string;
    };
    data: { jsToken: string; bdstoken: string };
    updateAppData(customPath?: string, retries?: number): Promise<unknown>;
    checkLogin(): Promise<{ errno: number; uk: number }>;
    getUserInfo(user_id: number): Promise<{
      errno: number;
      records?: Array<{ uname: string }>;
    }>;
    getQuota(): Promise<{ errno: number; total: number; used: number }>;
    getRemoteDir(
      remoteDir: string,
      page?: number
    ): Promise<{ errno: number; list: TeraboxListEntry[] }>;
    getFileMeta(
      remote_file_list: Array<{ path: string; fs_id?: number }>
    ): Promise<{ errno: number; info: TeraboxListEntry[] }>;
    createDir(remoteDir: string): Promise<{ errno: number }>;
    filemanager(
      operation: string,
      fmparams: unknown[]
    ): Promise<{ errno: number; info?: TeraboxListEntry[] }>;
    download(
      fs_ids: number[]
    ): Promise<{ errno: number; dlink: Array<{ dlink: string; filename?: string }> }>;
    precreateFile(data: {
      remote_dir: string;
      file: string;
      size: number;
      upload_id?: string;
      hash: {
        file: string;
        slice: string;
        crc32: number;
        chunks: string[];
      };
    }): Promise<{ errno: number; uploadid?: string; return_type?: number }>;
    getUploadHost(): Promise<{ host: string }>;
    uploadChunk(
      data: { remote_dir: string; file: string; upload_id: string },
      partseq: number,
      blob: Buffer
    ): Promise<unknown>;
    createFile(data: {
      remote_dir: string;
      file: string;
      size: number;
      upload_id: string;
      hash: {
        file: string;
        slice: string;
        crc32: number;
        chunks: string[];
      };
    }): Promise<TeraboxListEntry & { errno: number }>;
  }
}
