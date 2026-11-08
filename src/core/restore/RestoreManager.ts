
import { unzipSync } from "fflate";

import { DataMatrixReader } from "../codec/DataMatrixReader";
import { PbcDecoder } from "../backup/PbcDecoder";
import { ArchiveExporter, type RestoredFile } from "./ArchiveExporter";
import { EncryptionManager } from "../security/EncryptionManager";
import { CompressionManager } from "../backup/CompressionManager";
import { HashManager } from "../security/HashManager";

import type {
    PbcBlockPayload,
    PbcDocument
} from "../../types/Pbc";

interface ZipManifestFile {
    name: string;
    path: string;
    archivePath: string;
    size: number;
    hash: string;
}

interface ZipManifest {
    format: "PAPERBACKUP_ZIP";
    version: number;
    backupId: string;
    createdAt: string;
    files: ZipManifestFile[];
}

interface LegacyBackupFile {
    name: string;
    path: string;
    size: number;
    hash: string;
    data: string;
}

interface LegacyBackupPayload {
    format: "PAPERBACKUP_DATA";
    version: number;
    backupId: string;
    createdAt: string;
    files: LegacyBackupFile[];
}

function base64ToBytes(value: string): Uint8Array {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}

function isValidManifestFile(value: unknown): value is ZipManifestFile {
    if (!value || typeof value !== "object") {
        return false;
    }

    const file = value as Record<string, unknown>;

    return (
        typeof file.name === "string" &&
        typeof file.path === "string" &&
        typeof file.archivePath === "string" &&
        typeof file.size === "number" &&
        Number.isSafeInteger(file.size) &&
        file.size >= 0 &&
        typeof file.hash === "string" &&
        /^[a-f0-9]{64}$/i.test(file.hash)
    );
}

export class RestoreManager {
    static async restoreBackup(
        selectedFiles: File[],
        password?: string
    ): Promise<void> {
        if (selectedFiles.length === 0) {
            throw new Error(
                "Bitte wähle mindestens ein Bild oder PDF aus."
            );
        }

        const blocks = new Map<number, PbcBlockPayload["block"]>();
        let metadata: PbcBlockPayload | undefined;

        // 1. Codes aus Bildern und PDFs auslesen
        for (const file of selectedFiles) {
            const values = await DataMatrixReader.read(file);

            for (const value of values) {
                let payload: PbcBlockPayload;

                try {
                    payload = JSON.parse(value) as PbcBlockPayload;
                } catch {
                    continue;
                }

                if (
                    payload.format !== "PBC_BLOCK" ||
                    !payload.block ||
                    !payload.backupId
                ) {
                    continue;
                }

                if (
                    metadata &&
                    metadata.backupId !== payload.backupId
                ) {
                    throw new Error(
                        "Es wurden Codes aus unterschiedlichen Backups gefunden."
                    );
                }

                metadata ??= payload;

                const existing = blocks.get(payload.block.index);

                if (
                    existing &&
                    (
                        existing.checksum !== payload.block.checksum ||
                        existing.data !== payload.block.data
                    )
                ) {
                    throw new Error(
                        "Widersprüchliche Backup-Blöcke gefunden."
                    );
                }

                blocks.set(payload.block.index, payload.block);
            }
        }

        if (!metadata || blocks.size === 0) {
            throw new Error(
                "Es konnten keine gültigen PaperBackup-Codes erkannt werden."
            );
        }

        // 2. Blöcke sortieren und Vollständigkeit prüfen
        const sortedBlocks = Array.from(blocks.values())
            .sort((a, b) => a.index - b.index);

        const expectedBlocks = sortedBlocks[0].total;

        if (
            !Number.isSafeInteger(expectedBlocks) ||
            expectedBlocks < 1 ||
            sortedBlocks.some(block =>
                block.total !== expectedBlocks ||
                !Number.isSafeInteger(block.index) ||
                block.index < 0 ||
                block.index >= expectedBlocks
            )
        ) {
            throw new Error("Die Backup-Blöcke sind nicht kompatibel.");
        }

        if (sortedBlocks.length !== expectedBlocks) {
            throw new Error(
                `Backup unvollständig: ${sortedBlocks.length} von ${expectedBlocks} Blöcken erkannt.`
            );
        }

        // 3. PBC-Dokument zusammensetzen
        const document: PbcDocument = {
            format: "PBC",
            version: metadata.version,
            backupId: metadata.backupId,
            createdAt: metadata.createdAt,
            encrypted: metadata.encrypted,
            compressed: metadata.compressed,
            salt: metadata.salt,
            iv: metadata.iv,
            files: metadata.files ?? [],
            pages: [
                {
                    header: {
                        format: "PBC",
                        version: metadata.version,
                        backupId: metadata.backupId,
                        pageIndex: 0,
                        totalPages: 1,
                        createdAt: metadata.createdAt
                    },
                    blocks: sortedBlocks
                }
            ]
        };

        let data = await PbcDecoder.decode(document);

        // 4. Optional entschlüsseln
        if (metadata.encrypted) {
            if (!password) {
                throw new Error(
                    "Dieses Backup ist verschlüsselt. Bitte Passwort eingeben."
                );
            }

            if (!metadata.salt || !metadata.iv) {
                throw new Error(
                    "Verschlüsselungsinformationen fehlen."
                );
            }

            data = await EncryptionManager.decrypt(
                data,
                password,
                base64ToBytes(metadata.salt),
                base64ToBytes(metadata.iv)
            );
        }

        // 5. Version 2: ZIP-Archiv entpacken
        if (metadata.version >= 2) {
            await this.restoreZip(data, metadata.backupId);
            return;
        }

        // 6. Version 1: altes Backup-Format unterstützen
        if (metadata.compressed) {
            data = CompressionManager.decompress(data);
        }

        await this.restoreLegacy(data, metadata.backupId);
    }

    private static async restoreZip(
        data: Uint8Array,
        backupId: string
    ): Promise<void> {
        let archive: Record<string, Uint8Array>;

        try {
            archive = unzipSync(data);
        } catch {
            throw new Error(
                "Das ZIP-Backup ist beschädigt oder unvollständig."
            );
        }

        const manifestBytes =
            archive["__paperbackup__/manifest.json"];

        if (!manifestBytes) {
            throw new Error(
                "Das ZIP-Backup enthält kein PaperBackup-Manifest."
            );
        }

        let manifest: ZipManifest;

        try {
            manifest = JSON.parse(
                new TextDecoder().decode(manifestBytes)
            ) as ZipManifest;
        } catch {
            throw new Error("Das Backup-Manifest ist ungültig.");
        }

        if (
            manifest.format !== "PAPERBACKUP_ZIP" ||
            manifest.backupId !== backupId ||
            !Array.isArray(manifest.files)
        ) {
            throw new Error(
                "Das ZIP-Manifest gehört nicht zu diesem Backup."
            );
        }

        if (!manifest.files.every(isValidManifestFile)) {
            throw new Error(
                "Das Backup-Manifest enthält ungültige Dateiinformationen."
            );
        }

        const restoredFiles: RestoredFile[] = [];

        for (const file of manifest.files) {
            const archivePath = file.archivePath.replace(/\\/g, "/");

            if (
                archivePath.startsWith("/") ||
                archivePath.split("/").some(part => part === "..")
            ) {
                throw new Error(
                    `Ungültiger Archivpfad: ${file.archivePath}`
                );
            }

            const fileData = archive[archivePath];

            if (!fileData) {
                throw new Error(
                    `Datei fehlt im Archiv: ${file.name}`
                );
            }

            if (fileData.length !== file.size) {
                throw new Error(
                    `Dateigröße stimmt nicht: ${file.name}`
                );
            }

            const actualHash = await HashManager.sha256(fileData);

            if (actualHash.toLowerCase() !== file.hash.toLowerCase()) {
                throw new Error(
                    `Prüfsummenfehler bei Datei: ${file.name}`
                );
            }

            restoredFiles.push({
                name: file.name,
                path: file.path || file.name,
                data: new Uint8Array(fileData)
            });
        }

        ArchiveExporter.downloadZip(
            restoredFiles,
            `PaperBackup_${backupId}_Wiederherstellung.zip`
        );
    }

    private static async restoreLegacy(
        data: Uint8Array,
        backupId: string
    ): Promise<void> {
        let backup: LegacyBackupPayload;

        try {
            backup = JSON.parse(
                new TextDecoder().decode(data)
            ) as LegacyBackupPayload;
        } catch {
            throw new Error(
                "Die alten Backup-Daten sind beschädigt."
            );
        }

        if (
            backup.format !== "PAPERBACKUP_DATA" ||
            !Array.isArray(backup.files)
        ) {
            throw new Error("Ungültiges altes Backup-Format.");
        }

        const restoredFiles: RestoredFile[] = [];

        for (const file of backup.files) {
            const fileData = base64ToBytes(file.data);
            const actualHash = await HashManager.sha256(fileData);

            if (actualHash.toLowerCase() !== file.hash.toLowerCase()) {
                throw new Error(
                    `Prüfsummenfehler bei Datei: ${file.name}`
                );
            }

            restoredFiles.push({
                name: file.name,
                path: file.path || file.name,
                data: fileData
            });
        }

        ArchiveExporter.downloadZip(
            restoredFiles,
            `PaperBackup_${backupId}_Wiederherstellung.zip`
        );
    }
}
