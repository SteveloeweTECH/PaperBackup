# PaperBackup

Offline-orientiertes, papiergestütztes Backup-System mit Data-Matrix-Codes.

## Voraussetzungen

- Node.js 20.19+ oder 22.12+
- npm

## Installation und Start

```powershell
npm install
npm run dev
```

Danach die von Vite angezeigte lokale Adresse öffnen (normalerweise http://localhost:5173).

## Produktions-Build

```powershell
npm run build
npm run preview
```

## Offline-Hinweis

Die Data-Matrix-Lese- und Schreibmodule liegen lokal unter `public/wasm`. PaperBackup muss die ZXing-WebAssembly-Dateien daher nicht zur Laufzeit von einem CDN laden.

## Funktionen

- Mehrere Dateien und komplette Ordner auswählen
- Dateien vor dem Codieren komprimieren
- Optional AES-256-GCM-Verschlüsselung
- PDF mit Data-Matrix-Blöcken erzeugen
- Codes aus Bilddateien einlesen
- Wiederhergestellte Dateien als ZIP mit Ordnerstruktur speichern
- Backup-Metadaten lokal in IndexedDB verwalten
