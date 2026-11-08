import { ShieldCheck, Menu } from "lucide-react";

interface HeaderProps {
    title?: string;
    onMenuClick?: () => void;
}

export default function Header({
                                   title = "PaperBackup",
                                   onMenuClick
                               }: HeaderProps) {
    return (
        <header className="app-header">
            <div className="header-left">
                {onMenuClick && (
                    <button
                        className="mobile-menu-button"
                        type="button"
                        onClick={onMenuClick}
                        aria-label="Menü öffnen"
                    >
                        <Menu size={21} />
                    </button>
                )}

                <div>
                    <span className="header-overline">PAPERBACKUP</span>
                    <h2>{title}</h2>
                </div>
            </div>

            <div className="header-status">
                <ShieldCheck size={17} />
                <span>Lokaler Schutz aktiv</span>
            </div>
        </header>
    );
}