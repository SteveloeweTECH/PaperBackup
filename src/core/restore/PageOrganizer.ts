import type {
    PbcPage,
    PbcBlock
} from "../../types/Pbc";

interface ScannedBlock {
    backupId: string;
    pageIndex: number;
    blockIndex: number;
    totalBlocks: number;
    data: string;
    checksum: string;
}

export class PageOrganizer {
    static organize(
        scannedBlocks: ScannedBlock[]
    ): PbcPage[] {
        if (scannedBlocks.length === 0) {
            throw new Error("Keine lesbaren Datenblöcke gefunden.");
        }

        const backupIds = new Set(
            scannedBlocks.map((block) => block.backupId)
        );

        if (backupIds.size !== 1) {
            throw new Error(
                "Die Scans enthalten unterschiedliche Backups."
            );
        }

        const grouped = new Map<number, PbcBlock[]>();

        for (const scanned of scannedBlocks) {
            if (
                !Number.isInteger(scanned.pageIndex) ||
                scanned.pageIndex < 0 ||
                !Number.isInteger(scanned.blockIndex) ||
                scanned.blockIndex < 0
            ) {
                throw new Error("Ungültige Seiten- oder Blocknummer.");
            }

            const pageBlocks = grouped.get(scanned.pageIndex) ?? [];

            pageBlocks.push({
                index: scanned.blockIndex,
                total: scanned.totalBlocks,
                data: scanned.data,
                checksum: scanned.checksum
            });

            grouped.set(scanned.pageIndex, pageBlocks);
        }

        const totalPages =
            Math.max(...grouped.keys()) + 1;

        const backupId = scannedBlocks[0].backupId;
        const createdAt = new Date().toISOString();

        const pages: PbcPage[] = [];

        for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
            const blocks = grouped.get(pageIndex);

            if (!blocks) {
                throw new Error(
                    `Die Backup-Seite ${pageIndex + 1} fehlt.`
                );
            }

            const uniqueBlocks = new Map<number, PbcBlock>();

            for (const block of blocks) {
                const existing = uniqueBlocks.get(block.index);

                if (
                    existing &&
                    (
                        existing.data !== block.data ||
                        existing.checksum !== block.checksum
                    )
                ) {
                    throw new Error(
                        `Widersprüchliche Daten in Block ${block.index + 1}.`
                    );
                }

                uniqueBlocks.set(block.index, block);
            }

            pages.push({
                header: {
                    format: "PBC",
                    version: 1,
                    backupId,
                    pageIndex,
                    totalPages,
                    createdAt
                },
                blocks: Array.from(uniqueBlocks.values())
            });
        }

        return pages;
    }
}