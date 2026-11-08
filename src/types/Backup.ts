export interface BackupOptions {
    encryption: boolean;
    password?: string;
    compression?: boolean;
    chunkSize?: number;
}

export interface BackupFileEntry {
    name: string;
    path: string;
    size: number;
    hash: string;
    chunks: number;
}

export interface BackupManifest {
    id: string;
    createdAt: string;
    version: string;
    encrypted: boolean;
    compressed: boolean;
    files: BackupFileEntry[];
    totalSize: number;
    totalChunks: number;
}