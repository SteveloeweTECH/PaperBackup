import type { BackupManifest } from "../../types/Backup";

export class BackupStorage {
    private static readonly STORAGE_KEY = "paperbackup_history";

    static async save(manifest: BackupManifest): Promise<void> {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);

            const history: BackupManifest[] = stored
                ? JSON.parse(stored) as BackupManifest[]
                : [];

            history.unshift(manifest);

            localStorage.setItem(
                this.STORAGE_KEY,
                JSON.stringify(history)
            );
        } catch {
            throw new Error(
                "Backup konnte nicht im Verlauf gespeichert werden."
            );
        }
    }
}