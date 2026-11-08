import { useState } from "react";
import { BackupManager } from "../core/backup/BackupManager";

interface BackupOptions {
    encryption: boolean;
    password?: string;
    compression?: boolean;
    chunkSize?: number;
}

export function useBackup() {
    const [isCreating, setIsCreating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    async function createBackup(
        files: File[],
        options: BackupOptions
    ): Promise<boolean> {
        setIsCreating(true);
        setProgress(0);
        setError(null);

        try {
            setProgress(20);

            await BackupManager.createBackup(files, options);

            setProgress(100);
            return true;
        } catch (err) {
            const message = err instanceof Error
                ? err.message
                : "Backup konnte nicht erstellt werden.";

            setError(message);
            return false;
        } finally {
            setIsCreating(false);
        }
    }

    return {
        createBackup,
        isCreating,
        progress,
        error
    };
}