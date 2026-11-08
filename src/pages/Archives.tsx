import { useEffect, useState } from "react";
import {
    Archive,
    CalendarDays,
    Database,
    FileText,
    HardDrive,
    RefreshCw,
    Search,
    Trash2
} from "lucide-react";

import { BackupStorage } from "../storage/BackupStorage";

interface BackupRecord {
    id: string;
    name?: string;
    createdAt: string;
    totalSize: number;
    fileCount: number;
    encrypted: boolean;
}

export default function Archives() {
    const [backups, setBackups] = useState<BackupRecord[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadBackups() {
        setLoading(true);
        setError("");

        try {
            const records = await BackupStorage.getAll();
            setBackups(records.map(record => ({
                id: record.id,
                name: record.filename,
                createdAt: record.manifest.createdAt,
                totalSize: record.manifest.totalSize,
                fileCount: record.manifest.files.length,
                encrypted: record.manifest.encrypted
            })));
        } catch {
            setError("Die gespeicherten Backups konnten nicht geladen werden.");
        } finally {
            setLoading(false);
        }
    }

    async function deleteBackup(id: string) {
        if (!window.confirm("Möchtest du diesen Archiveintrag wirklich löschen?")) {
            return;
        }

        try {
            await BackupStorage.delete(id);
            await loadBackups();
        } catch {
            setError("Der Archiveintrag konnte nicht gelöscht werden.");
        }
    }

    useEffect(() => {
        void loadBackups();
    }, []);

    const filteredBackups = backups.filter(backup =>
        (backup.name ?? backup.id)
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const totalSize = backups.reduce(
        (total, backup) => total + (backup.totalSize || 0),
        0
    );

    function formatSize(bytes: number) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    }

    return (
        <div className="page-container">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">VERWALTUNG</span>
                    <h1>Backup-Archiv</h1>
                    <p>Verwalte die in diesem Browser gespeicherten Backup-Einträge.</p>
                </div>

                <div className="heading-icon">
                    <Archive size={26} />
                </div>
            </div>

            <div className="archive-statistics">
                <div className="archive-stat-card">
                    <div className="stat-icon">
                        <Database size={20} />
                    </div>
                    <div>
                        <span>Archiveinträge</span>
                        <strong>{backups.length}</strong>
                    </div>
                </div>

                <div className="archive-stat-card">
                    <div className="stat-icon">
                        <HardDrive size={20} />
                    </div>
                    <div>
                        <span>Gesamtgröße</span>
                        <strong>{formatSize(totalSize)}</strong>
                    </div>
                </div>

                <div className="archive-stat-card">
                    <div className="stat-icon">
                        <CalendarDays size={20} />
                    </div>
                    <div>
                        <span>Letzte Sicherung</span>
                        <strong>
                            {backups.length > 0
                                ? new Date(
                                    Math.max(
                                        ...backups.map(item =>
                                            new Date(item.createdAt).getTime()
                                        )
                                    )
                                ).toLocaleDateString("de-DE")
                                : "Keine"}
                        </strong>
                    </div>
                </div>
            </div>

            <section className="panel archive-panel">
                <div className="archive-toolbar">
                    <div>
                        <h2>Gespeicherte Backups</h2>
                        <p>Übersicht deiner Backup-Metadaten.</p>
                    </div>

                    <button
                        className="secondary-button"
                        type="button"
                        onClick={() => void loadBackups()}
                        disabled={loading}
                    >
                        <RefreshCw size={16} />
                        Aktualisieren
                    </button>
                </div>

                <div className="archive-search">
                    <Search size={17} />
                    <input
                        type="search"
                        placeholder="Backup suchen …"
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                    />
                </div>

                {error && <div className="error-message">{error}</div>}

                {loading ? (
                    <div className="archive-empty">
                        <RefreshCw size={25} />
                        <strong>Archiv wird geladen …</strong>
                    </div>
                ) : filteredBackups.length === 0 ? (
                    <div className="archive-empty">
                        <Archive size={30} />
                        <strong>
                            {search ? "Keine passenden Backups gefunden" : "Archiv ist leer"}
                        </strong>
                        <span>
              {search
                  ? "Ändere deinen Suchbegriff."
                  : "Erstellte Backup-Metadaten werden hier angezeigt."}
            </span>
                    </div>
                ) : (
                    <div className="archive-list">
                        {filteredBackups.map(backup => (
                            <div className="archive-row" key={backup.id}>
                                <div className="archive-file-icon">
                                    <FileText size={21} />
                                </div>

                                <div className="archive-details">
                                    <strong>{backup.name ?? `Backup ${backup.id.slice(0, 8)}`}</strong>
                                    <span>
                    {new Date(backup.createdAt).toLocaleString("de-DE")}
                                        {" · "}
                                        {backup.fileCount} Dateien
                                        {" · "}
                                        {formatSize(backup.totalSize)}
                  </span>
                                </div>

                                {backup.encrypted && (
                                    <span className="archive-encrypted">Verschlüsselt</span>
                                )}

                                <button
                                    className="icon-button danger-icon"
                                    type="button"
                                    onClick={() => void deleteBackup(backup.id)}
                                    aria-label="Archiveintrag löschen"
                                >
                                    <Trash2 size={17} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <div className="archive-notice">
                <Database size={18} />
                <p>
                    Das Archiv speichert derzeit nur Metadaten. Die eigentlichen
                    Backup-PDF-Dateien müssen separat aufbewahrt werden.
                </p>
            </div>
        </div>
    );
}