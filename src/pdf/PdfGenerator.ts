
import { jsPDF } from "jspdf";

import type { PbcBlockPayload, PbcDocument } from "../types/Pbc";
import { DataMatrixGenerator } from "../core/codec/DataMatrixGenerator";
import {
    DEFAULT_PRINT_SETTINGS,
    type PrintSettings
} from "./PrintSettings";

function throwIfAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
        throw new DOMException(
            "Backup wurde abgebrochen.",
            "AbortError"
        );
    }
}

function validateSettings(settings: PrintSettings): void {
    if (
        !Number.isFinite(settings.margin) ||
        settings.margin < 0 ||
        !Number.isFinite(settings.codeSize) ||
        settings.codeSize <= 0 ||
        !Number.isInteger(settings.codesPerRow) ||
        settings.codesPerRow < 1 ||
        !Number.isInteger(settings.codesPerColumn) ||
        settings.codesPerColumn < 1
    ) {
        throw new Error("Die Druckeinstellungen sind ungültig.");
    }

    const width = settings.orientation === "portrait" ? 210 : 297;
    const height = settings.orientation === "portrait" ? 297 : 210;

    const cellWidth =
        (width - settings.margin * 2) / settings.codesPerRow;

    const cellHeight =
        (height - settings.margin * 2) / settings.codesPerColumn;

    if (
        settings.codeSize > cellWidth ||
        settings.codeSize > cellHeight
    ) {
        throw new Error(
            "Die Codes passen mit diesen Einstellungen nicht auf eine A4-Seite."
        );
    }
}

export class PdfGenerator {
    static async generate(
        document: PbcDocument,
        settings: PrintSettings = DEFAULT_PRINT_SETTINGS,
        onProgress?: (completed: number, total: number) => void,
        signal?: AbortSignal
    ): Promise<Blob> {
        if (!document.pages.length) {
            throw new Error("Das Backup enthält keine PDF-Seiten.");
        }

        validateSettings(settings);

        const blocks = document.pages.flatMap(page => page.blocks);

        if (blocks.length === 0) {
            throw new Error("Das Backup enthält keine Datenblöcke.");
        }

        const blocksPerPage =
            settings.codesPerRow * settings.codesPerColumn;

        const totalPages = Math.ceil(blocks.length / blocksPerPage);

        const pdf = new jsPDF({
            orientation: settings.orientation,
            unit: "mm",
            format: "a4"
        });

        const pageWidth =
            settings.orientation === "portrait" ? 210 : 297;

        const pageHeight =
            settings.orientation === "portrait" ? 297 : 210;

        const usableWidth = pageWidth - settings.margin * 2;
        const usableHeight = pageHeight - settings.margin * 2;

        const cellWidth = usableWidth / settings.codesPerRow;
        const cellHeight = usableHeight / settings.codesPerColumn;

        let completed = 0;

        for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
            throwIfAborted(signal);

            if (pageIndex > 0) {
                pdf.addPage();
            }

            const pageBlocks = blocks.slice(
                pageIndex * blocksPerPage,
                (pageIndex + 1) * blocksPerPage
            );

            for (let i = 0; i < pageBlocks.length; i++) {
                throwIfAborted(signal);

                const block = pageBlocks[i];

                const row = Math.floor(i / settings.codesPerRow);
                const column = i % settings.codesPerRow;

                const payload: PbcBlockPayload = {
                    format: "PBC_BLOCK",
                    version: document.version,
                    backupId: document.backupId,
                    pageIndex,
                    totalPages,
                    createdAt: document.createdAt,
                    encrypted: document.encrypted,
                    compressed: document.compressed,
                    salt: document.salt,
                    iv: document.iv,
                    files: [],
                    block
                };

                let image: string;

                try {
                    image = await DataMatrixGenerator.generate(
                        JSON.stringify(payload)
                    );
                } catch (error) {
                    throw new Error(
                        `Fehler bei Block ${block.index + 1}: ${
                            error instanceof Error
                                ? error.message
                                : "Unbekannter Fehler"
                        }`
                    );
                }

                throwIfAborted(signal);

                const x =
                    settings.margin +
                    column * cellWidth +
                    (cellWidth - settings.codeSize) / 2;

                const y =
                    settings.margin +
                    row * cellHeight +
                    (cellHeight - settings.codeSize) / 2;

                pdf.addImage(
                    image,
                    "PNG",
                    x,
                    y,
                    settings.codeSize,
                    settings.codeSize
                );

                completed++;
                onProgress?.(completed, blocks.length);

                await new Promise<void>(resolve =>
                    window.setTimeout(resolve, 0)
                );
            }
        }

        throwIfAborted(signal);

        return pdf.output("blob");
    }

    static download(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    static async generateAndDownload(
        document: PbcDocument,
        settings: PrintSettings = DEFAULT_PRINT_SETTINGS
    ): Promise<void> {
        const blob = await this.generate(document, settings);

        const date = new Date()
            .toISOString()
            .replace(/[:.]/g, "-");

        this.download(blob, `PaperBackup_${date}.pdf`);
    }
}
