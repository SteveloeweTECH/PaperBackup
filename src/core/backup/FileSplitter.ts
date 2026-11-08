export interface FileChunk {
    index: number;
    total: number;
    data: Uint8Array;
}

export class FileSplitter {
    static split(
        data: Uint8Array,
        chunkSize = 256 * 1024
    ): FileChunk[] {
        if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
            throw new Error("Ungültige Chunk-Größe.");
        }

        const total = Math.max(1, Math.ceil(data.length / chunkSize));
        const chunks: FileChunk[] = [];

        for (let index = 0; index < total; index++) {
            const start = index * chunkSize;
            const end = Math.min(start + chunkSize, data.length);

            chunks.push({
                index,
                total,
                data: data.slice(start, end)
            });
        }

        return chunks;
    }

    static join(chunks: FileChunk[]): Uint8Array {
        if (chunks.length === 0) {
            return new Uint8Array();
        }

        const sorted = [...chunks].sort(
            (a, b) => a.index - b.index
        );

        const expectedTotal = sorted[0].total;

        if (
            sorted.length !== expectedTotal ||
            sorted.some((chunk, index) =>
                chunk.index !== index ||
                chunk.total !== expectedTotal
            )
        ) {
            throw new Error("Datei-Chunks sind unvollständig oder beschädigt.");
        }

        const totalLength = sorted.reduce(
            (sum, chunk) => sum + chunk.data.length,
            0
        );

        const result = new Uint8Array(totalLength);
        let offset = 0;

        for (const chunk of sorted) {
            result.set(chunk.data, offset);
            offset += chunk.data.length;
        }

        return result;
    }
}