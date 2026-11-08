import {
    LayoutDashboard,
    DatabaseBackup,
    RefreshCw,
    Archive,
    Settings,
    ShieldCheck,
    ChevronLeft
} from "lucide-react";

export type Page =
    | "dashboard"
    | "backup"
    | "restore"
    | "archives"
    | "settings";

interface SidebarProps {
    currentPage: Page;
    setPage: (page: Page) => void;
    collapsed?: boolean;
    onToggle?: () => void;
}

const navigation: {
    id: Page;
    label: string;
    icon: typeof LayoutDashboard;
}[] = [
    {
        id: "dashboard",
        label: "Übersicht",
        icon: LayoutDashboard
    },
    {
        id: "backup",
        label: "Backup erstellen",
        icon: DatabaseBackup
    },
    {
        id: "restore",
        label: "Wiederherstellen",
        icon: RefreshCw
    },
    {
        id: "archives",
        label: "Archive",
        icon: Archive
    },
    {
        id: "settings",
        label: "Einstellungen",
        icon: Settings
    }
];

export default function Sidebar({
                                    currentPage,
                                    setPage,
                                    collapsed = false,
                                    onToggle
                                }: SidebarProps) {
    return (
        <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
            <div className="sidebar-brand">
                <div className="brand-icon">
                    <ShieldCheck size={23} />
                </div>

                {!collapsed && (
                    <div className="brand-text">
                        <strong>PaperBackup</strong>
                        <span>Offline Data Protection</span>
                    </div>
                )}
            </div>

            <div className="sidebar-section-label">
                {!collapsed && "MENÜ"}
            </div>

            <nav className="sidebar-navigation">
                {navigation.map(item => {
                    const Icon = item.icon;
                    const active = currentPage === item.id;

                    return (
                        <button
                            key={item.id}
                            type="button"
                            className={`nav-item ${active ? "active" : ""}`}
                            onClick={() => setPage(item.id)}
                            title={collapsed ? item.label : undefined}
                        >
                            <Icon size={20} />
                            {!collapsed && <span>{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            <div className="sidebar-bottom">
                <div className="offline-indicator">
                    <span className="online-dot" />
                    {!collapsed && (
                        <div>
                            <strong>Offline bereit</strong>
                            <span>Lokale Verarbeitung</span>
                        </div>
                    )}
                </div>

                {onToggle && (
                    <button
                        type="button"
                        className="sidebar-toggle"
                        onClick={onToggle}
                        aria-label="Menü ein- oder ausklappen"
                    >
                        <ChevronLeft
                            size={19}
                            className={collapsed ? "rotate-icon" : ""}
                        />
                    </button>
                )}
            </div>
        </aside>
    );
}