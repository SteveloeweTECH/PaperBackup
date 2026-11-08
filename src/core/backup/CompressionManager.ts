import {
    compressSync,
    decompressSync
} from "fflate";

export class CompressionManager {
    static compress(data: Uint8Array): Uint8Array {
        return compressSync(data, {
            level: 6
        });
    }

    static decompress(data: Uint8Array): Uint8Array {
        try {
            return decompressSync(data);
        } catch {
            throw new Error(
                "Die Daten konnten nicht entpackt werden."
            );
        }
    }
}