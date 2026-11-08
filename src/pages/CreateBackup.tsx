import { useRef, useState } from "react";
import {
    DatabaseBackup,
    FilePlus2,
    FileText,
    LockKeyhole,
    ShieldCheck,
    Trash2,
    CheckCircle2,
    AlertCircle,
    FileArchive,
    FolderPlus,
    ChevronDown,
    ChevronUp,
    Square
} from "lucide-react";

import { BackupManager } from "../core/backup/BackupManager";

export default function CreateBackup() {
    const filesInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    const [files, setFiles] = useState<File[]>([]);
    const [encryption, setEncryption] = useState(false);
    const [compression, setCompression] = useState(true);
    const [password, setPassword] = useState("");
    const [creating, setCreating] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [progress, setProgress] = useState(0);
    const [progressLabel, setProgressLabel] = useState("");
    const [showFileList, setShowFileList] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const totalSize = files.reduce(
        (total, file) => total + file.size,
        0
    );

    function addFiles(selected: FileList | null) {
        if (!selected) return;

        setFiles(previous => {
            const combined = [...previous, ...Array.from(selected)];
            const unique = new Map<string, File>();

            for (const file of combined) {
                const path = file.webkitRelativePath || file.name;
                unique.set(
                    `${path}-${file.size}-${file.lastModified}`,
                    file
                );
            }

            return Array.from(unique.values());
        });

        setMessage("");
        setError("");
    }

    function removeFile(index: number) {
        setFiles(previous =>
            previous.filter((_, current) => current !== index)
        );
    }

    function clearFiles() {
        setFiles([]);
        setMessage("");
        setError("");
    }

    function formatSize(bytes: number) {
        if (bytes < 1024) return `${bytes.toFixed(0)} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) {
            return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
        }

        return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
    }

    async function createBackup() {
        if (files.length === 0) {
            setError("Bitte wähle mindestens eine Datei oder einen Ordner aus.");
            return;
        }

        if (encryption && password.length < 8) {
            setError("Das Passwort muss mindestens 8 Zeichen lang sein.");
            return;
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        setCreating(true);
        setProgress(0);
        setProgressLabel("Backup wird vorbereitet …");
        setError("");
        setMessage("");

        try {
            await BackupManager.createBackup(
                files,
                {
                    encryption,
                    password: encryption ? password : undefined,
                    compression
                },
                update => {
                    setProgress(Math.round(update.percent));
                    setProgressLabel(update.label);
                },
                controller.signal
            );

            setMessage("Das PaperBackup-PDF wurde erstellt.");
            setProgress(100);
            setProgressLabel("Backup erfolgreich erstellt.");
            setFiles([]);
            setPassword("");
            setShowFileList(false);
        } catch (err) {
            if (err instanceof Error && err.name === "AbortError") {
                setMessage("Backup wurde gestoppt. Es wurde kein PDF gespeichert.");
                setProgressLabel("Abgebrochen");
            } else {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Das Backup konnte nicht erstellt werden."
                );
                setMessage("");
            }
        } finally {
            abortControllerRef.current = null;
            setCreating(false);
        }
    }

    function stopBackup() {
        abortControllerRef.current?.abort();
    }

    return (
        <div className="page-container">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">DATENSICHERUNG</span>
                    <h1>Neues Backup erstellen</h1>
                    <p>
                        Sichere einzelne Dateien oder komplette Ordner in einem
                        PaperBackup-PDF.
                    </p>
                </div>

                <div className="heading-icon">
                    <DatabaseBackup size={26} />
                </div>
            </div>

            <div className="backup-layout">
                <section className="panel backup-files-panel">
                    <div className="section-heading">
                        <div className="section-icon">
                            <FilePlus2 size={20} />
                        </div>
                        <div>
                            <h2>Dateien und Ordner auswählen</h2>
                            <p>Alle Dateitypen werden unterstützt.</p>
                        </div>
                    </div>

                    <div className="backup-selection-buttons">
                        <button
                            className="selection-button"
                            type="button"
                            onClick={() => filesInputRef.current?.click()}
                            disabled={creating}
                        >
                            <FilePlus2 size={20} />
                            <strong>Dateien auswählen</strong>
                            <span>Eine oder mehrere Dateien</span>
                        </button>

                        <button
                            className="selection-button"
                            type="button"
                            onClick={() => folderInputRef.current?.click()}
                            disabled={creating}
                        >
                            <FolderPlus size={20} />
                            <strong>Ordner auswählen</strong>
                            <span>Mit allen Unterordnern</span>
                        </button>
                    </div>

                    <input
                        ref={filesInputRef}
                        type="file"
                        multiple
                        hidden
                        onChange={event => {
                            addFiles(event.target.files);
                            event.target.value = "";
                        }}
                    />

                    <input
                        ref={folderInputRef}
                        type="file"
                        multiple
                        hidden
                        {...({ webkitdirectory: "", directory: "" } as object)}
                        onChange={event => {
                            addFiles(event.target.files);
                            event.target.value = "";
                        }}
                    />

                    <button
                        className="backup-file-heading backup-file-toggle"
                        type="button"
                        onClick={() => setShowFileList(value => !value)}
                        aria-expanded={showFileList}
                    >
                        <strong>Ausgewählte Dateien</strong>
                        <span>{files.length} Dateien</span>
                        {showFileList ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                    </button>

                    {showFileList && (
                        files.length === 0 ? (
                            <div className="empty-files">
                                <FileArchive size={28} />
                                <strong>Noch keine Dateien ausgewählt</strong>
                                <span>Wähle Dateien oder einen kompletten Ordner aus.</span>
                            </div>
                        ) : (
                            <>
                                <div className="backup-file-list">
                                    {files.map((file, index) => (
                                        <div
                                            className="backup-file-row"
                                            key={`${file.webkitRelativePath || file.name}-${file.size}-${index}`}
                                        >
                                            <div className="file-icon">
                                                <FileText size={19} />
                                            </div>

                                            <div className="file-information">
                                                <strong>{file.webkitRelativePath || file.name}</strong>
                                                <span>{formatSize(file.size)}</span>
                                            </div>

                                            <button
                                                type="button"
                                                className="icon-button"
                                                onClick={() => removeFile(index)}
                                                disabled={creating}
                                                aria-label="Datei entfernen"
                                            >
                                                <Trash2 size={17} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    className="clear-selection-button"
                                    type="button"
                                    onClick={clearFiles}
                                    disabled={creating}
                                >
                                    <Trash2 size={15} />
                                    Gesamte Auswahl entfernen
                                </button>
                            </>
                        )
                    )}

                    <div className="file-summary">
                        <span>Gesamtgröße</span>
                        <strong>{formatSize(totalSize)}</strong>
                    </div>
                </section>

                <section className="panel backup-options-panel">
                    <div className="section-heading">
                        <div className="section-icon">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h2>Sicherheitsoptionen</h2>
                            <p>Konfiguriere dein Backup.</p>
                        </div>
                    </div>

                    <label className="setting-option">
                        <div className="setting-option-icon">
                            <LockKeyhole size={19} />
                        </div>

                        <div className="setting-option-text">
                            <strong>Passwortverschlüsselung</strong>
                            <span>AES-256 schützt deine Daten.</span>
                        </div>

                        <input
                            type="checkbox"
                            checked={encryption}
                            onChange={event => setEncryption(event.target.checked)}
                            disabled={creating}
                        />
                    </label>

                    {encryption && (
                        <div className="password-field">
                            <label className="field-label" htmlFor="backup-password">
                                Backup-Passwort
                            </label>

                            <input
                                id="backup-password"
                                className="text-input"
                                type="password"
                                placeholder="Mindestens 8 Zeichen"
                                value={password}
                                onChange={event => setPassword(event.target.value)}
                                disabled={creating}
                                autoComplete="new-password"
                            />

                            <span className="field-hint">
                Bewahre dein Passwort sicher auf.
              </span>
                        </div>
                    )}

                    <label className="setting-option">
                        <div className="setting-option-icon">
                            <FileArchive size={19} />
                        </div>

                        <div className="setting-option-text">
                            <strong>Datenkomprimierung</strong>
                            <span>Reduziert die Datenmenge vor dem Codieren.</span>
                        </div>

                        <input
                            type="checkbox"
                            checked={compression}
                            onChange={event => setCompression(event.target.checked)}
                            disabled={creating}
                        />
                    </label>

                    <div className="backup-info">
                        <ShieldCheck size={18} />
                        <p>
                            Die Dateien werden lokal verarbeitet. Es ist kein
                            Cloud-Konto erforderlich.
                        </p>
                    </div>

                    <button
                        className="primary-button full-button create-backup-button"
                        type="button"
                        onClick={createBackup}
                        disabled={creating || files.length === 0}
                    >
                        <DatabaseBackup size={18} />
                        PaperBackup-PDF erstellen
                    </button>

                    {creating && (
                        <div className="backup-progress-panel">
                            <div className="backup-progress-heading">
                                <strong>{progressLabel}</strong>
                                <span>{progress}%</span>
                            </div>
                            <div
                                className="progress-track"
                                role="progressbar"
                                aria-valuenow={progress}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            >
                                <div className="progress-fill" style={{ width: `${progress}%` }} />
                            </div>
                            <button
                                className="secondary-button full-button backup-stop-button"
                                type="button"
                                onClick={stopBackup}
                            >
                                <Square size={15} />
                                Backup stoppen
                            </button>
                        </div>
                    )}

                    {message && (
                        <div className="success-message">
                            <CheckCircle2 size={18} />
                            <span>{message}</span>
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}