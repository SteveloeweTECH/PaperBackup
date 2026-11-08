
import type {
    PbcBlock,
    PbcDocument,
    PbcFileEntry,
    PbcPage
} from "../../types/Pbc";

import { HashManager } from "../security/HashManager";

export class PbcEncoder {
    static async encode(
        data: Uint8Array,
        backupId: string,
        files: PbcFileEntry[],
        encrypted: boolean,
        compressed: boolean,
        salt?: string,
        iv?: string,
        blockSize = 900
    ): Promise<PbcDocument> {
        const createdAt = new Date().toISOString();

        // Maximal 900 Base64-Zeichen pro Block.
        const safeBlockSize = Math.min(
            Math.max(100, Math.floor(blockSize)),
            900
        );

        // 3 Bytes ergeben genau 4 Base64-Zeichen.
        const rawChunkSize = Math.floor(safeBlockSize / 4) * 3;

        const totalBlocks = Math.max(
            1,
            Math.ceil(data.length / rawChunkSize)
        );

        const blocks: PbcBlock[] = [];
        const encoder = new TextEncoder();
        const batchSize = 32;

        for (let start = 0; start < totalBlocks; start += batchSize) {
            const end = Math.min(start + batchSize, totalBlocks);

            const batch = await Promise.all(
                Array.from({ length: end - start }, async (_, offset) => {
                    const index = start + offset;

                    const rawChunk = data.subarray(
                        index * rawChunkSize,
                        Math.min((index + 1) * rawChunkSize, data.length)
                    );

                    const chunk = this.toBase64(rawChunk);

                    return {
                        index,
                        total: totalBlocks,
                        data: chunk,
                        checksum: await HashManager.sha256(
                            encoder.encode(chunk)
                        )
                    };
                })
            );

            blocks.push(...batch);

            // Gibt dem Browser Gelegenheit, andere Aufgaben auszuführen.
            await new Promise<void>(resolve => setTimeout(resolve, 0));
        }

        const blocksPerPage = 20;
        const totalPages = Math.ceil(blocks.length / blocksPerPage);

        const pages: PbcPage[] = [];

        for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
            pages.push({
                header: {
                    format: "PBC",
                    version: 2,
                    backupId,
                    pageIndex,
                    totalPages,
                    createdAt
                },
                blocks: blocks.slice(
                    pageIndex * blocksPerPage,
                    (pageIndex + 1) * blocksPerPage
                )
            });
        }

        return {
            format: "PBC",
            version: 2,
            backupId,
            createdAt,
            encrypted,
            compressed,
            salt,
            iv,
            files,
            pages
        };
    }

    private static toBase64(data: Uint8Array): string {
        let binary = "";
        const chunkSize = 0x8000;

        for (let i = 0; i < data.length; i += chunkSize) {
            binary += String.fromCharCode(
                ...data.subarray(i, i + chunkSize)
            );
        }

        return btoa(binary);
    }
}
