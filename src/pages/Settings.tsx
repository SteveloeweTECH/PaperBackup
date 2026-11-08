import { useEffect, useState } from "react";
import {
    Settings as SettingsIcon,
    ShieldCheck,
    Database,
    Palette,
    RotateCcw,
    Save,
    HardDrive,
    Info
} from "lucide-react";

import { SettingsStorage } from "../storage/SettingsStorage";
import {
    DEFAULT_SETTINGS,
    type AppSettings
} from "../types/Settings";

export default function Settings() {
    const [settings, setSettings] =
        useState<AppSettings>(DEFAULT_SETTINGS);

    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadSettings() {
            try {
                const stored = await SettingsStorage.load();

                if (stored) {
                    setSettings({
                        ...DEFAULT_SETTINGS,
                        ...stored
                    });
                }
            } catch {
                setError("Einstellungen konnten nicht geladen werden.");
            } finally {
                setLoading(false);
            }
        }

        void loadSettings();
    }, []);

    function updateSetting<K extends keyof AppSettings>(
        key: K,
        value: AppSettings[K]
    ) {
        setSettings(previous => ({
            ...previous,
            [key]: value
        }));

        setSaved(false);
    }

    async function saveSettings() {
        try {
            setError("");

            await SettingsStorage.save(settings);

            setSaved(true);
        } catch {
            setError("Einstellungen konnten nicht gespeichert werden.");
        }
    }

    async function resetSettings() {
        if (!window.confirm("Alle Einstellungen auf Standard zurücksetzen?")) {
            return;
        }

        try {
            await SettingsStorage.reset();
            setSettings(DEFAULT_SETTINGS);
            setSaved(false);
            setError("");
        } catch {
            setError("Einstellungen konnten nicht zurückgesetzt werden.");
        }
    }

    if (loading) {
        return (
            <div className="page-container">
                <div className="archive-empty">
                    Einstellungen werden geladen …
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">KONFIGURATION</span>
                    <h1>Einstellungen</h1>
                    <p>Konfiguriere PaperBackup nach deinen Anforderungen.</p>
                </div>

                <div className="heading-icon">
                    <SettingsIcon size={26} />
                </div>
            </div>

            <section className="panel settings-panel">
                <div className="section-heading">
                    <div className="section-icon">
                        <Palette size={20} />
                    </div>
                    <div>
                        <h2>Erscheinungsbild</h2>
                        <p>Lege das Design der Anwendung fest.</p>
                    </div>
                </div>

                <div className="settings-field">
                    <div>
                        <strong>Design</strong>
                        <span>Wähle dein bevorzugtes Farbschema.</span>
                    </div>

                    <select
                        className="settings-select"
                        value={settings.theme}
                        onChange={event =>
                            updateSetting(
                                "theme",
                                event.target.value as AppSettings["theme"]
                            )
                        }
                    >
                        <option value="dark">Dunkel</option>
                        <option value="light">Hell</option>
                    </select>
                </div>
            </section>

            <section className="panel settings-panel">
                <div className="section-heading">
                    <div className="section-icon">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h2>Backup-Sicherheit</h2>
                        <p>Standardoptionen für neue Sicherungen.</p>
                    </div>
                </div>

                <label className="setting-option">
                    <div className="setting-option-icon">
                        <ShieldCheck size={19} />
                    </div>
                    <div className="setting-option-text">
                        <strong>Verschlüsselung standardmäßig aktivieren</strong>
                        <span>Neue Backups standardmäßig verschlüsseln.</span>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.encryption}
                        onChange={event =>
                            updateSetting("encryption", event.target.checked)
                        }
                    />
                </label>

                <label className="setting-option">
                    <div className="setting-option-icon">
                        <Database size={19} />
                    </div>
                    <div className="setting-option-text">
                        <strong>Komprimierung aktivieren</strong>
                        <span>Dateien vor dem Erstellen des Backups komprimieren.</span>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.compression}
                        onChange={event =>
                            updateSetting("compression", event.target.checked)
                        }
                    />
                </label>

                <div className="settings-field">
                    <div>
                        <strong>Blockgröße</strong>
                        <span>Größe der Datenblöcke für die QR-/Data-Matrix-Codes.</span>
                    </div>

                    <select
                        className="settings-select"
                        value={settings.chunkSize}
                        onChange={event =>
                            updateSetting("chunkSize", Number(event.target.value))
                        }
                    >
                        <option value={500}>500 Bytes</option>
                        <option value={700}>700 Bytes</option>
                        <option value={900}>900 Bytes</option>
                    </select>
                </div>

                <div className="settings-field">
                    <div>
                        <strong>Fehlerkorrektur</strong>
                        <span>Gewünschte Fehlerkorrektur für die Codes.</span>
                    </div>

                    <select
                        className="settings-select"
                        value={settings.errorCorrection}
                        onChange={event =>
                            updateSetting("errorCorrection", event.target.value as AppSettings["errorCorrection"])
                        }
                    >
                        <option value="standard">Standard</option>
                        <option value="high">Hoch</option>
                    </select>
                </div>
            </section>

            <section className="panel settings-panel">
                <div className="section-heading">
                    <div className="section-icon">
                        <HardDrive size={20} />
                    </div>
                    <div>
                        <h2>Speicherung</h2>
                        <p>Lokale Speicherung und Archivoptionen.</p>
                    </div>
                </div>

                <label className="setting-option">
                    <div className="setting-option-icon">
                        <Database size={19} />
                    </div>
                    <div className="setting-option-text">
                        <strong>Lokale Metadaten speichern</strong>
                        <span>Backup-Informationen im lokalen Browser speichern.</span>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.autoSave}
                        onChange={event =>
                            updateSetting("autoSave", event.target.checked)
                        }
                    />
                </label>

                <div className="settings-information">
                    <Info size={18} />
                    <p>
                        PaperBackup verwendet derzeit IndexedDB für lokale
                        Einstellungen und Archivinformationen.
                    </p>
                </div>
            </section>

            {error && <div className="error-message">{error}</div>}

            {saved && (
                <div className="success-message">
                    <ShieldCheck size={18} />
                    Einstellungen erfolgreich gespeichert.
                </div>
            )}

            <div className="settings-actions">
                <button
                    className="secondary-button"
                    type="button"
                    onClick={() => void resetSettings()}
                >
                    <RotateCcw size={16} />
                    Zurücksetzen
                </button>

                <button
                    className="primary-button"
                    type="button"
                    onClick={() => void saveSettings()}
                >
                    <Save size={17} />
                    Einstellungen speichern
                </button>
            </div>
        </div>
    );
}