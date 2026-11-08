export class FileReader {
    static async read(file: File): Promise<Uint8Array> {
        return new Uint8Array(await file.arrayBuffer());
    }

    static getFilePath(file: File): string {
        const relativeFile = file as File & {
            webkitRelativePath?: string;
        };

        return relativeFile.webkitRelativePath || file.name;
    }
}