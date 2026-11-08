import { HashManager } from "../security/HashManager";

export interface RestoredFile {
    name: string;
    path: string;
    size: number;
    hash: string;
    data: Uint8Array;
}

export class FileAssembler {
    static async verifyFiles(
        files: RestoredFile[]
    ): Promise<RestoredFile[]> {
        for (const file of files) {
            if (file.data.length !== file.size) {
                throw new Error(
                    `Die Dateigröße stimmt nicht: ${file.name}`
                );
            }

            const valid = await HashManager.verify(
                file.data,
                file.hash
            );

            if (!valid) {
                throw new Error(
                    `SHA-256-Prüfung fehlgeschlagen: ${file.name}`
                );
            }
        }

        return files;
    }

    static downloadFiles(files: RestoredFile[]): void {
        for (const file of files) {
            const data = new Uint8Array(file.data.byteLength);
            data.set(file.data);
            const blob = new Blob([data.buffer]);
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = file.name;

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);
        }
    }
}