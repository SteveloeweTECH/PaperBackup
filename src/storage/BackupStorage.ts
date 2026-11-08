import { Database } from "./Database";
import type { BackupManifest } from "../types/Backup";

export interface StoredBackup {
    id: string;
    manifest: BackupManifest;
    filename: string;
    savedAt: string;
}

export class BackupStorage {
    static async save(
        manifest: BackupManifest,
        filename: string
    ): Promise<void> {
        const backup: StoredBackup = {
            id: manifest.id,
            manifest,
            filename,
            savedAt: new Date().toISOString()
        };

        await Database.save("backups", backup);
    }

    static async getAll(): Promise<StoredBackup[]> {
        return Database.getAll<StoredBackup>("backups");
    }

    static async get(id: string): Promise<StoredBackup | undefined> {
        return Database.get<StoredBackup>("backups", id);
    }

    static async delete(id: string): Promise<void> {
        await Database.delete("backups", id);
    }
}