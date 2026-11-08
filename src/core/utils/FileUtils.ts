export class FileUtils {
    static formatFileName(name: string): string {
        return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
    }

    static getExtension(name: string): string {
        const index = name.lastIndexOf(".");

        return index >= 0
            ? name.substring(index).toLowerCase()
            : "";
    }

    static isImage(file: File): boolean {
        return file.type.startsWith("image/");
    }

    static isBackup(file: File): boolean {
        return file.name.toLowerCase().endsWith(".pbc");
    }

    static formatSize(bytes: number): string {
        if (bytes < 1024) {
            return `${bytes} B`;
        }

        const units = ["KB", "MB", "GB", "TB"];
        let size = bytes / 1024;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
}