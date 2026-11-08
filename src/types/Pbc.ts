export interface PbcHeader {
    format: "PBC";
    version: number;
    backupId: string;
    pageIndex: number;
    totalPages: number;
    createdAt: string;
}

export interface PbcBlock {
    index: number;
    total: number;
    data: string;
    checksum: string;
}

export interface PbcPage {
    header: PbcHeader;
    blocks: PbcBlock[];
}

export interface PbcFileEntry {
    name: string;
    path: string;
    size: number;
    hash: string;
    chunks: number;
}

export interface PbcDocument {
    format: "PBC";
    version: number;
    backupId: string;
    createdAt: string;

    encrypted: boolean;
    compressed: boolean;

    salt?: string;
    iv?: string;

    files: PbcFileEntry[];
    pages: PbcPage[];
}

export interface PbcBlockPayload {
    format: "PBC_BLOCK";
    version: number;
    backupId: string;
    pageIndex: number;
    totalPages: number;
    createdAt: string;

    encrypted: boolean;
    compressed: boolean;

    salt?: string;
    iv?: string;

    files: PbcFileEntry[];

    block: PbcBlock;
}