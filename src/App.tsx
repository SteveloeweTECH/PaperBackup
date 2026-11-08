import { useState } from "react";

import Sidebar, { type Page } from "./components/Sidebar";
import Header from "./components/Header";

import Dashboard from "./pages/Dashboard";
import CreateBackup from "./pages/CreateBackup";
import RestoreBackup from "./pages/RestoreBackup";
import Archives from "./pages/Archives";
import AppSettings from "./pages/Settings";

const pageTitles: Record<Page, string> = {
  dashboard: "Übersicht",
  backup: "Backup erstellen",
  restore: "Wiederherstellung",
  archives: "Backup-Archive",
  settings: "Einstellungen"
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function navigate(page: Page) {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  }

  function renderPage() {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard setPage={navigate} />;

      case "backup":
        return <CreateBackup />;

      case "restore":
        return <RestoreBackup />;

      case "archives":
        return <Archives />;

      case "settings":
        return <AppSettings />;

      default:
        return <Dashboard setPage={navigate} />;
    }
  }

  return (
      <div className="app-shell">
        {mobileMenuOpen && (
            <button
                className="mobile-backdrop"
                type="button"
                aria-label="Menü schließen"
                onClick={() => setMobileMenuOpen(false)}
            />
        )}

        <div className={mobileMenuOpen ? "mobile-sidebar open" : "mobile-sidebar"}>
          <Sidebar
              currentPage={currentPage}
              setPage={navigate}
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(value => !value)}
          />
        </div>

        <main className="main-area">
          <Header
              title={pageTitles[currentPage]}
              onMenuClick={() => setMobileMenuOpen(true)}
          />

          <div className="page-content">
            {renderPage()}
          </div>

          <footer className="app-footer">
            <span>PaperBackup</span>
            <span>Lokale Datensicherung · Keine Cloud erforderlich</span>
          </footer>
        </main>
      </div>
  );
}