
import type { PbcDocument, PbcBlock } from "../../types/Pbc";
import { HashManager } from "../security/HashManager";

export class PbcDecoder {
    static async decode(document: PbcDocument): Promise<Uint8Array> {
        if (
            document.format !== "PBC" ||
            !Array.isArray(document.pages) ||
            document.pages.length === 0
        ) {
            throw new Error("Ungültiges PaperBackup-Format.");
        }

        const blocks = document.pages
            .flatMap(page => page.blocks)
            .sort((a, b) => a.index - b.index);

        if (blocks.length === 0) {
            throw new Error("Das Backup enthält keine Datenblöcke.");
        }

        const expectedTotal = blocks[0].total;

        if (
            !Number.isSafeInteger(expectedTotal) ||
            expectedTotal < 1 ||
            blocks.length !== expectedTotal
        ) {
            throw new Error(
                `Backup unvollständig: ${blocks.length} von ${expectedTotal} Blöcken gefunden.`
            );
        }

        const encoder = new TextEncoder();

        // Blöcke in kleinen Gruppen parallel überprüfen.
        const batchSize = 32;

        for (let start = 0; start < blocks.length; start += batchSize) {
            const batch = blocks.slice(start, start + batchSize);

            const results = await Promise.all(
                batch.map(async (block, offset) => {
                    const expectedIndex = start + offset;

                    if (
                        block.index !== expectedIndex ||
                        block.total !== expectedTotal ||
                        typeof block.data !== "string" ||
                        typeof block.checksum !== "string"
                    ) {
                        throw new Error(
                            `Datenblock ${expectedIndex} fehlt oder ist ungültig.`
                        );
                    }

                    return HashManager.verify(
                        encoder.encode(block.data),
                        block.checksum
                    );
                })
            );

            for (let i = 0; i < results.length; i++) {
                if (!results[i]) {
                    throw new Error(
                        `Prüfsummenfehler bei Block ${start + i}.`
                    );
                }
            }
        }

        // Base64-Daten zusammensetzen.
        const base64 = blocks
            .map((block: PbcBlock) => block.data)
            .join("");

        // Ungültige Base64-Daten erkennen.
        if (
            base64.length === 0 ||
            base64.length % 4 !== 0 ||
            !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)
        ) {
            throw new Error(
                "Die Backup-Daten sind beschädigt (ungültiges Base64-Format)."
            );
        }

        let binary: string;

        try {
            binary = atob(base64);
        } catch {
            throw new Error(
                "Die Backup-Daten konnten nicht dekodiert werden."
            );
        }

        const result = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++) {
            result[i] = binary.charCodeAt(i);
        }

        return result;
    }
}
