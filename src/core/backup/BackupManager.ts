
import { zipSync } from "fflate";

import type {
    BackupFileEntry,
    BackupManifest,
    BackupOptions
} from "../../types/Backup";

import { HashManager } from "../security/HashManager";
import { EncryptionManager } from "../security/EncryptionManager";
import { PbcEncoder } from "./PbcEncoder";
import { PdfGenerator } from "../../pdf/PdfGenerator";
import { createId } from "../utils/createId";
import { BackupStorage } from "./BackupStorage";

export interface BackupProgress {
    percent: number;
    label: string;
}

interface ZipManifestFile {
    name: string;
    path: string;
    archivePath: string;
    size: number;
    hash: string;
}

interface ZipManifest {
    format: "PAPERBACKUP_ZIP";
    version: 1;
    backupId: string;
    createdAt: string;
    files: ZipManifestFile[];
}

function safePath(path: string): string {
    return path
        .replace(/\\/g, "/")
        .replace(/^\/+/, "")
        .split("/")
        .filter(part => part && part !== "." && part !== "..")
        .map(part => part.replace(/[<>:"|?*\x00-\x1F]/g, "_"))
        .join("/") || "Datei";
}

function uniquePath(path: string, used: Set<string>): string {
    const parts = path.split("/");
    const filename = parts.pop() || "Datei";
    const directory = parts.join("/");
    const dot = filename.lastIndexOf(".");
    const base = dot > 0 ? filename.slice(0, dot) : filename;
    const extension = dot > 0 ? filename.slice(dot) : "";

    let candidate = path;
    let counter = 2;

    while (used.has(candidate.toLowerCase())) {
        const nextName = `${base} (${counter})${extension}`;
        candidate = directory ? `${directory}/${nextName}` : nextName;
        counter++;
    }

    used.add(candidate.toLowerCase());
    return candidate;
}

export class BackupManager {
    static async createBackup(
        files: File[],
        options: BackupOptions,
        onProgress?: (progress: BackupProgress) => void,
        signal?: AbortSignal
    ): Promise<void> {
        if (!files.length) {
            throw new Error("Bitte wähle mindestens eine Datei aus.");
        }

        if (options.encryption && !options.password) {
            throw new Error("Bitte gib ein Verschlüsselungspasswort ein.");
        }

        const report = (percent: number, label: string): void => {
            if (signal?.aborted) {
                throw new DOMException("Backup abgebrochen.", "AbortError");
            }

            onProgress?.({ percent, label });
        };

        const backupId = createId();
        const createdAt = new Date().toISOString();

        const archive: Record<string, Uint8Array> = {};
        const usedPaths = new Set<string>();

        const manifestFiles: BackupFileEntry[] = [];
        const zipManifestFiles: ZipManifestFile[] = [];

        let totalSize = 0;

        for (let i = 0; i < files.length; i++) {
            report(
                5 + Math.round((i / files.length) * 25),
                `Datei wird verarbeitet: ${files[i].name}`
            );

            const file = files[i];
            const data = new Uint8Array(await file.arrayBuffer());
            const hash = await HashManager.sha256(data);

            const originalPath =
                (file as File & { webkitRelativePath?: string })
                    .webkitRelativePath || file.name;

            const archivePath = uniquePath(
                safePath(originalPath),
                usedPaths
            );

            archive[archivePath] = data;

            manifestFiles.push({
                name: file.name,
                path: originalPath,
                size: file.size,
                hash,
                chunks: 1
            });

            zipManifestFiles.push({
                name: file.name,
                path: originalPath,
                archivePath,
                size: file.size,
                hash
            });

            totalSize += file.size;
        }

        report(32, "ZIP-Archiv wird erstellt...");

        const zipManifest: ZipManifest = {
            format: "PAPERBACKUP_ZIP",
            version: 1,
            backupId,
            createdAt,
            files: zipManifestFiles
        };

        archive["__paperbackup__/manifest.json"] =
            new TextEncoder().encode(JSON.stringify(zipManifest));

        const zipData = zipSync(archive, {
            level: options.compression === false ? 0 : 1
        });

        let backupData = zipData;
        let encrypted = false;
        let salt: string | undefined;
        let iv: string | undefined;

        if (options.encryption) {
            report(40, "Backup wird verschlüsselt...");

            const result = await EncryptionManager.encrypt(
                backupData,
                options.password!
            );

            backupData = result.data;
            salt = result.salt;
            iv = result.iv;
            encrypted = true;
        }

        report(50, "Data-Matrix-Blöcke werden erstellt...");

        const chunkSize = Math.min(
            Math.max(100, Math.floor(options.chunkSize ?? 1500)),
            1500
        );

        const document = await PbcEncoder.encode(
            backupData,
            backupId,
            manifestFiles,
            encrypted,
            options.compression !== false,
            salt,
            iv,
            chunkSize
        );

        report(65, "PDF wird erstellt...");

        const pdfBlob = await PdfGenerator.generate(
            document,
            undefined,
            (completed, total) => {
                const percent = 65 + Math.round((completed / total) * 33);
                onProgress?.({
                    percent,
                    label: `Data-Matrix-Codes: ${completed} von ${total}`
                });
            },
            signal
        );

        if (signal?.aborted) {
            throw new DOMException("Backup abgebrochen.", "AbortError");
        }

        report(99, "PDF wird gespeichert...");

        PdfGenerator.download(
            pdfBlob,
            `PaperBackup_${backupId}.pdf`
        );

        const manifest: BackupManifest = {
            id: backupId,
            createdAt,
            version: "2.0",
            encrypted,
            compressed: options.compression !== false,
            files: manifestFiles,
            totalSize,
            totalChunks: document.pages.reduce(
                (sum, page) => sum + page.blocks.length,
                0
            )
        };

        try {
            await BackupStorage.save(manifest);
        } catch {
            // Ein Fehler beim lokalen Verlauf verhindert den PDF-Export nicht.
        }

        report(100, "Backup erfolgreich erstellt.");
    }
}
