import type { PbcDocument } from "../types/Pbc";
import { HashManager } from "../core/security/HashManager";

export interface BackupValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    pageCount: number;
    blockCount: number;
}

export class BackupValidator {
    static async validate(
        document: PbcDocument
    ): Promise<BackupValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (document.format !== "PBC") {
            errors.push("Unbekanntes Backup-Format.");
        }

        if (document.version !== 1) {
            errors.push("Nicht unterstützte PBC-Version.");
        }

        if (!document.backupId) {
            errors.push("Backup-ID fehlt.");
        }

        if (!Array.isArray(document.pages) || document.pages.length === 0) {
            errors.push("Das Backup enthält keine Seiten.");
        }

        if (errors.length > 0) {
            return {
                valid: false,
                errors,
                warnings,
                pageCount: 0,
                blockCount: 0
            };
        }

        const pageIndices = new Set<number>();
        const blockIndices = new Set<number>();
        let blockCount = 0;

        for (const page of document.pages) {
            if (page.header.backupId !== document.backupId) {
                errors.push("Eine Seite gehört zu einem anderen Backup.");
            }

            if (pageIndices.has(page.header.pageIndex)) {
                errors.push("Eine Backup-Seite ist doppelt vorhanden.");
            }

            pageIndices.add(page.header.pageIndex);

            for (const block of page.blocks) {
                blockCount++;

                if (blockIndices.has(block.index)) {
                    errors.push("Ein Datenblock ist doppelt vorhanden.");
                }

                blockIndices.add(block.index);

                const checksumValid = await HashManager.verify(
                    new TextEncoder().encode(block.data),
                    block.checksum
                );

                if (!checksumValid) {
                    errors.push(
                        `Prüfsummenfehler bei Datenblock ${block.index}.`
                    );
                }
            }
        }

        if (document.pages.length !== document.pages[0].header.totalPages) {
            warnings.push("Die Anzahl der Seiten stimmt nicht mit dem Seitenkopf überein.");
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            pageCount: document.pages.length,
            blockCount
        };
    }
}