import { HashManager } from "../core/security/HashManager";

export interface IntegrityResult {
    valid: boolean;
    expectedHash: string;
    actualHash: string;
    message: string;
}

export class IntegrityChecker {
    static async check(
        data: Uint8Array,
        expectedHash: string
    ): Promise<IntegrityResult> {
        const actualHash = await HashManager.sha256(data);
        const valid =
            actualHash.toLowerCase() === expectedHash.toLowerCase();

        return {
            valid,
            expectedHash,
            actualHash,
            message: valid
                ? "Die Integritätsprüfung war erfolgreich."
                : "Die Daten wurden verändert oder sind beschädigt."
        };
    }

    static async checkMultiple(
        files: Array<{
            name: string;
            data: Uint8Array;
            hash: string;
        }>
    ): Promise<{
        valid: boolean;
        results: IntegrityResult[];
    }> {
        const results: IntegrityResult[] = [];

        for (const file of files) {
            results.push(
                await this.check(file.data, file.hash)
            );
        }

        return {
            valid: results.every((result) => result.valid),
            results
        };
    }
}