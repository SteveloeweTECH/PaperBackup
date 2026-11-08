import type { PrintSettings } from "./PrintSettings";

export interface PageDimensions {
    width: number;
    height: number;
    contentWidth: number;
    contentHeight: number;
    startX: number;
    startY: number;
    cellWidth: number;
    cellHeight: number;
}

export class PageLayout {
    static readonly A4_WIDTH = 210;
    static readonly A4_HEIGHT = 297;

    static calculate(
        settings: PrintSettings
    ): PageDimensions {
        const landscape = settings.orientation === "landscape";

        const width = landscape
            ? this.A4_HEIGHT
            : this.A4_WIDTH;

        const height = landscape
            ? this.A4_WIDTH
            : this.A4_HEIGHT;

        const contentWidth = width - settings.margin * 2;
        const contentHeight = height - settings.margin * 2;

        const headerSpace = settings.showHeader ? 14 : 0;
        const footerSpace = settings.showFooter ? 10 : 0;

        const availableHeight =
            contentHeight - headerSpace - footerSpace;

        return {
            width,
            height,
            contentWidth,
            contentHeight,
            startX: settings.margin,
            startY: settings.margin + headerSpace,
            cellWidth: contentWidth / settings.codesPerRow,
            cellHeight: availableHeight / settings.codesPerColumn
        };
    }
}