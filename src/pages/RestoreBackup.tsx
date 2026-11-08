import { useRef, useState } from "react";
import {
    Camera,
    FileImage,
    LockKeyhole,
    RefreshCw,
    ShieldCheck,
    Upload,
    X,
    CheckCircle2,
    AlertCircle
} from "lucide-react";

import { RestoreManager } from "../core/restore/RestoreManager";
import { ScanValidator } from "../scanner/ScanValidator";

export default function RestoreBackup() {
    const inputRef = useRef<HTMLInputElement>(null);

    const [files, setFiles] = useState<File[]>([]);
    const [password, setPassword] = useState("");
    const [restoring, setRestoring] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [progress, setProgress] = useState(0);
    const [scanInfo, setScanInfo] = useState<{
        found: number;
        total: number;
    } | null>(null);

    function addFiles(selected: FileList | null) {
        if (!selected) return;

        const scanFiles = Array.from(selected).filter(file =>
            file.type.startsWith("image/") ||
            file.type === "application/pdf" ||
            file.name.toLowerCase().endsWith(".pdf")
        );

        if (scanFiles.length === 0) {
            setError("Bitte wähle Bilder oder eine PDF-Datei mit Data-Matrix-Codes aus.");
            return;
        }

        setFiles(previous => {
            const combined = [...previous, ...scanFiles];

            return combined.filter(
                (file, index, array) =>
                    array.findIndex(
                        item =>
                            item.name === file.name &&
                            item.size === file.size &&
                            item.lastModified === file.lastModified
                    ) === index
            );
        });

        setError("");
        setMessage("");
        setScanInfo(null);
    }

    function removeFile(index: number) {
        setFiles(previous =>
            previous.filter((_, current) => current !== index)
        );
    }

    async function inspectFiles() {
        if (files.length === 0) {
            setError("Bitte füge zuerst Backup-Bilder oder ein Backup-PDF hinzu.");
            return;
        }

        setError("");
        setMessage("Codes werden überprüft …");

        const foundBlocks = new Set<string>();
        let total = 0;

        try {
            for (const file of files) {
                const result = await ScanValidator.validate(file);

                if (result.valid && result.backupId) {
                    total = Math.max(total, result.totalBlocks);
                    for (const payload of result.payloads) {
                        foundBlocks.add(`${payload.backupId}:${payload.block.index}`);
                    }
                }
            }

            const found = foundBlocks.size;
            setScanInfo({ found, total });

            if (found === 0) {
                setError("Es wurden keine gültigen PaperBackup-Codes gefunden.");
                setMessage("");
                return;
            }

            setMessage(
                `${found} von ${total} benötigten Datenblöcken erkannt.`
            );
        } catch {
            setError("Die Bilder konnten nicht überprüft werden.");
            setMessage("");
        }
    }

    async function restore() {
        if (files.length === 0) {
            setError("Bitte wähle zuerst Backup-Bilder oder ein Backup-PDF aus.");
            return;
        }

        setRestoring(true);
        setError("");
        setMessage("Wiederherstellung wird vorbereitet …");
        setProgress(15);

        try {
            await new Promise(resolve => setTimeout(resolve, 150));

            setProgress(45);

            await RestoreManager.restoreBackup(
                files,
                password || undefined
            );

            setProgress(100);
            setMessage(
                "Wiederherstellung abgeschlossen. Deine Dateien wurden heruntergeladen."
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Die Wiederherstellung ist fehlgeschlagen."
            );
            setMessage("");
        } finally {
            setRestoring(false);
        }
    }

    return (
        <div className="page-container">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">DATENWIEDERHERSTELLUNG</span>
                    <h1>Backup wiederherstellen</h1>
                    <p>
                        Lies deine PaperBackup-Codes ein und stelle deine Dateien wieder her.
                    </p>
                </div>

                <div className="heading-icon">
                    <RefreshCw size={25} />
                </div>
            </div>

            <div className="restore-grid">
                <section className="panel restore-main">
                    <div className="section-heading">
                        <div className="section-icon">
                            <FileImage size={20} />
                        </div>
                        <div>
                            <h2>Backup-Codes hinzufügen</h2>
                            <p>Wähle die gescannten Code-Bilder aus.</p>
                        </div>
                    </div>

                    <button
                        className="upload-area"
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={restoring}
                    >
                        <div className="upload-icon">
                            <Upload size={27} />
                        </div>

                        <strong>Bilder oder PDF auswählen</strong>
                        <span>PNG, JPG, JPEG, WebP oder PDF</span>

                        <span className="upload-button-label">
              Dateien durchsuchen
            </span>
                    </button>

                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*,application/pdf,.pdf"
                        multiple
                        hidden
                        onChange={event => {
                            addFiles(event.target.files);
                            event.target.value = "";
                        }}
                    />

                    {files.length > 0 && (
                        <div className="file-list">
                            <div className="list-heading">
                                <strong>Ausgewählte Scan-Dateien</strong>
                                <span>{files.length} Dateien</span>
                            </div>

                            {files.map((file, index) => (
                                <div className="file-row" key={`${file.name}-${index}`}>
                                    <div className="file-icon">
                                        <FileImage size={19} />
                                    </div>

                                    <div className="file-information">
                                        <strong>{file.name}</strong>
                                        <span>
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                                    </div>

                                    <button
                                        className="icon-button"
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        disabled={restoring}
                                        aria-label="Datei entfernen"
                                    >
                                        <X size={17} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        className="secondary-button full-button"
                        type="button"
                        onClick={inspectFiles}
                        disabled={restoring || files.length === 0}
                    >
                        <ShieldCheck size={18} />
                        Codes überprüfen
                    </button>

                    {scanInfo && (
                        <div className="scan-information">
                            <CheckCircle2 size={19} />
                            <span>
                {scanInfo.found} von {scanInfo.total} Blöcken erkannt
              </span>
                        </div>
                    )}
                </section>

                <section className="panel restore-options">
                    <div className="section-heading">
                        <div className="section-icon">
                            <LockKeyhole size={20} />
                        </div>
                        <div>
                            <h2>Sicherheit</h2>
                            <p>Passwort für verschlüsselte Backups.</p>
                        </div>
                    </div>

                    <label className="field-label" htmlFor="restore-password">
                        Backup-Passwort
                    </label>

                    <input
                        id="restore-password"
                        className="text-input"
                        type="password"
                        placeholder="Passwort eingeben"
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        disabled={restoring}
                        autoComplete="off"
                    />

                    <div className="security-note">
                        <ShieldCheck size={18} />
                        <span>
              Die Wiederherstellung erfolgt lokal in deinem Browser.
            </span>
                    </div>

                    <button
                        className="primary-button full-button"
                        type="button"
                        onClick={restore}
                        disabled={restoring || files.length === 0}
                    >
                        {restoring ? (
                            <>
                                <RefreshCw size={18} className="spin" />
                                Wiederherstellung läuft …
                            </>
                        ) : (
                            <>
                                <RefreshCw size={18} />
                                Backup wiederherstellen
                            </>
                        )}
                    </button>

                    {restoring && (
                        <div className="progress-container">
                            <div className="progress-label">
                                <span>Fortschritt</span>
                                <strong>{progress}%</strong>
                            </div>
                            <div className="progress-track">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
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

            <section className="panel restore-hint">
                <Camera size={22} />
                <div>
                    <strong>Hinweis zum Scannen</strong>
                    <p>
                        Du kannst einzelne Bilder oder das komplette PaperBackup-PDF hochladen.
                        PDF-Seiten werden automatisch einzeln gerendert und nach Data-Matrix-Codes
                        durchsucht. Für die Wiederherstellung müssen alle Datenblöcke vorhanden sein.
                    </p>
                </div>
            </section>
        </div>
    );
}