import {
    DatabaseBackup,
    Files,
    HardDrive,
    ShieldCheck,
    ArrowRight,
    Plus,
    RefreshCw,
    Archive,
    Clock3,
    LockKeyhole
} from "lucide-react";

import type { Page } from "../components/Sidebar";

interface DashboardProps {
    setPage: (page: Page) => void;
}

export default function Dashboard({ setPage }: DashboardProps) {
    const statistics = [
        {
            title: "Backups erstellt",
            value: "0",
            description: "Bisherige Sicherungen",
            icon: DatabaseBackup
        },
        {
            title: "Gesicherte Dateien",
            value: "0",
            description: "Dateien insgesamt",
            icon: Files
        },
        {
            title: "Speicherbedarf",
            value: "0 MB",
            description: "Lokale Backup-Daten",
            icon: HardDrive
        },
        {
            title: "Sicherheitsstatus",
            value: "Aktiv",
            description: "Lokale Verarbeitung",
            icon: ShieldCheck
        }
    ];

    return (
        <div className="page-container">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">PERSÖNLICHER DATENSCHUTZ</span>
                    <h1>Willkommen bei PaperBackup</h1>
                    <p>
                        Erstelle physische Datensicherungen und stelle deine Dateien
                        jederzeit wieder her.
                    </p>
                </div>

                <div className="heading-icon">
                    <ShieldCheck size={26} />
                </div>
            </div>

            <section className="dashboard-hero">
                <div className="hero-content">
          <span className="hero-label">
            <span className="online-dot" />
            DEINE DATEN. DEINE KONTROLLE.
          </span>

                    <h2>Deine Dateien auf Papier sichern.</h2>

                    <p>
                        PaperBackup verwandelt deine Dateien in Data-Matrix-Codes,
                        die du als PDF ausdrucken und später wieder einlesen kannst.
                    </p>

                    <button
                        className="primary-button hero-button"
                        type="button"
                        onClick={() => setPage("backup")}
                    >
                        <Plus size={18} />
                        Neues Backup erstellen
                    </button>
                </div>

                <div className="hero-graphic">
                    <div className="hero-circle">
                        <DatabaseBackup size={54} />
                    </div>
                    <div className="hero-small-icon">
                        <LockKeyhole size={21} />
                    </div>
                </div>
            </section>

            <section className="dashboard-statistics">
                {statistics.map(item => {
                    const Icon = item.icon;

                    return (
                        <article className="stat-card" key={item.title}>
                            <div className="stat-card-top">
                                <span>{item.title}</span>
                                <div className="stat-icon">
                                    <Icon size={19} />
                                </div>
                            </div>

                            <strong className="stat-value">{item.value}</strong>
                            <span className="stat-description">
                {item.description}
              </span>
                        </article>
                    );
                })}
            </section>

            <section className="dashboard-lower">
                <div className="panel quick-actions">
                    <div className="section-heading">
                        <div className="section-icon">
                            <Plus size={20} />
                        </div>
                        <div>
                            <h2>Schnellzugriff</h2>
                            <p>Die wichtigsten Funktionen auf einen Blick.</p>
                        </div>
                    </div>

                    <button
                        className="action-row"
                        type="button"
                        onClick={() => setPage("backup")}
                    >
                        <div className="action-icon">
                            <DatabaseBackup size={20} />
                        </div>
                        <div>
                            <strong>Backup erstellen</strong>
                            <span>Dateien auswählen und als PDF sichern</span>
                        </div>
                        <ArrowRight size={18} />
                    </button>

                    <button
                        className="action-row"
                        type="button"
                        onClick={() => setPage("restore")}
                    >
                        <div className="action-icon">
                            <RefreshCw size={20} />
                        </div>
                        <div>
                            <strong>Backup wiederherstellen</strong>
                            <span>Codes einlesen und Dateien rekonstruieren</span>
                        </div>
                        <ArrowRight size={18} />
                    </button>

                    <button
                        className="action-row"
                        type="button"
                        onClick={() => setPage("archives")}
                    >
                        <div className="action-icon">
                            <Archive size={20} />
                        </div>
                        <div>
                            <strong>Archive verwalten</strong>
                            <span>Gespeicherte Sicherungen anzeigen</span>
                        </div>
                        <ArrowRight size={18} />
                    </button>

                    <button
                        className="action-row"
                        type="button"
                        onClick={() => setPage("settings")}
                    >
                        <div className="action-icon">
                            <HardDrive size={20} />
                        </div>
                        <div>
                            <strong>Einstellungen</strong>
                            <span>PaperBackup konfigurieren</span>
                        </div>
                        <ArrowRight size={18} />
                    </button>
                </div>

                <div className="panel dashboard-status">
                    <div className="section-heading">
                        <div className="section-icon">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h2>Systemstatus</h2>
                            <p>Informationen zur Anwendung.</p>
                        </div>
                    </div>

                    <div className="status-line">
                        <span className="status-indicator" />
                        <div>
                            <strong>Lokale Verarbeitung</strong>
                            <span>Keine Cloud erforderlich</span>
                        </div>
                    </div>

                    <div className="status-line">
                        <span className="status-indicator" />
                        <div>
                            <strong>Offline-Funktionen</strong>
                            <span>Für lokale Nutzung vorgesehen</span>
                        </div>
                    </div>

                    <div className="status-line">
                        <span className="status-indicator status-warning" />
                        <div>
                            <strong>Backup-Archiv</strong>
                            <span>Noch keine Sicherungen registriert</span>
                        </div>
                    </div>

                    <div className="status-footer">
                        <Clock3 size={15} />
                        <span>PaperBackup – Version 1.0.0</span>
                    </div>
                </div>
            </section>
        </div>
    );
}