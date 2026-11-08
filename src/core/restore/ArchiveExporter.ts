
import { zipSync } from "fflate";

export interface RestoredFile {
    name: string;
    path: string;
    data: Uint8Array;
}

function sanitizePath(path: string): string {
    const normalized = path
        .replace(/\\/g, "/")
        .replace(/^\/+/, "");

    const safeParts = normalized
        .split("/")
        .filter(part =>
            part !== "" &&
            part !== "." &&
            part !== ".."
        )
        .map(part =>
            part.replace(/[<>:"|?*\x00-\x1F]/g, "_")
        );

    return safeParts.join("/") || "unbenannte-datei";
}

function createUniquePath(
    path: string,
    usedPaths: Set<string>
): string {
    if (!usedPaths.has(path.toLowerCase())) {
        usedPaths.add(path.toLowerCase());
        return path;
    }

    const lastSlash = path.lastIndexOf("/");
    const directory = lastSlash >= 0
        ? path.slice(0, lastSlash + 1)
        : "";

    const filename = lastSlash >= 0
        ? path.slice(lastSlash + 1)
        : path;

    const dot = filename.lastIndexOf(".");
    const base = dot > 0
        ? filename.slice(0, dot)
        : filename;

    const extension = dot > 0
        ? filename.slice(dot)
        : "";

    let counter = 2;
    let candidate: string;

    do {
        candidate = `${directory}${base} (${counter})${extension}`;
        counter++;
    } while (usedPaths.has(candidate.toLowerCase()));

    usedPaths.add(candidate.toLowerCase());

    return candidate;
}

export class ArchiveExporter {
    static createZip(files: RestoredFile[]): Uint8Array {
        if (files.length === 0) {
            throw new Error(
                "Keine Dateien zum Wiederherstellen gefunden."
            );
        }

        const archive: Record<string, Uint8Array> = {};
        const usedPaths = new Set<string>();

        for (const file of files) {
            if (!(file.data instanceof Uint8Array)) {
                throw new Error(
                    `Ungültige Dateidaten: ${file.name}`
                );
            }

            const safePath = sanitizePath(file.path || file.name);
            const uniquePath = createUniquePath(
                safePath,
                usedPaths
            );

            archive[uniquePath] = file.data;
        }

        // Schnelle Komprimierung für die Wiederherstellung.
        return zipSync(archive, {
            level: 1
        });
    }

    static downloadZip(
        files: RestoredFile[],
        filename = "PaperBackup_Wiederherstellung.zip"
    ): void {
        const zipData = ArchiveExporter.createZip(files);

        const blob = new Blob([zipData], {
            type: "application/zip"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = filename;
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 5000);
    }
}
