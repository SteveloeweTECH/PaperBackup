import type { PbcBlockPayload } from "../types/Pbc";
import { DataMatrixReader } from "../core/codec/DataMatrixReader";
import { HashManager } from "../core/security/HashManager";

export interface ScanResult {
    valid: boolean;
    backupId: string | null;
    blocksFound: number;
    totalBlocks: number;
    messages: string[];
    payloads: PbcBlockPayload[];
}

export class ScanValidator {
    static async validate(file: File): Promise<ScanResult> {
        const messages: string[] = [];
        const payloads: PbcBlockPayload[] = [];

        const result: ScanResult = {
            valid: false,
            backupId: null,
            blocksFound: 0,
            totalBlocks: 0,
            messages,
            payloads
        };

        let values: string[];

        try {
            values = await DataMatrixReader.read(file);
        } catch (error) {
            messages.push(
                error instanceof Error
                    ? error.message
                    : "Bild konnte nicht gelesen werden."
            );

            return result;
        }

        if (values.length === 0) {
            messages.push("Keine Data-Matrix-Codes gefunden.");
            return result;
        }

        for (const value of values) {
            try {
                const payload = JSON.parse(value) as PbcBlockPayload;

                if (
                    payload.format !== "PBC_BLOCK" ||
                    payload.version !== 1 ||
                    typeof payload.backupId !== "string" ||
                    !payload.block ||
                    typeof payload.block.index !== "number" ||
                    typeof payload.block.total !== "number" ||
                    typeof payload.block.data !== "string" ||
                    typeof payload.block.checksum !== "string"
                ) {
                    continue;
                }

                const checksum = await HashManager.sha256(
                    new TextEncoder().encode(payload.block.data)
                );

                if (checksum !== payload.block.checksum) {
                    messages.push(
                        `Block ${payload.block.index + 1}: Prüfsumme stimmt nicht.`
                    );
                    continue;
                }

                const duplicate = payloads.some(
                    item =>
                        item.backupId === payload.backupId &&
                        item.block.index === payload.block.index
                );

                if (!duplicate) {
                    payloads.push(payload);
                }
            } catch {
                continue;
            }
        }

        if (payloads.length === 0) {
            messages.push("Keine gültigen PaperBackup-Blöcke gefunden.");
            return result;
        }

        const backupId = payloads[0].backupId;

        const matchingPayloads = payloads.filter(
            item => item.backupId === backupId
        );

        const totalBlocks = matchingPayloads[0].block.total;

        result.valid = true;
        result.backupId = backupId;
        result.blocksFound = matchingPayloads.length;
        result.totalBlocks = totalBlocks;
        result.payloads = matchingPayloads;

        messages.push(
            `${matchingPayloads.length} von ${totalBlocks} Blöcken erkannt.`
        );

        return result;
    }
}