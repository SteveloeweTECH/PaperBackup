
export interface PrintSettings {
    orientation: "portrait" | "landscape";
    margin: number;
    codeSize: number;
    codesPerRow: number;
    codesPerColumn: number;
    showHeader: boolean;
    showFooter: boolean;
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
    orientation: "portrait",
    margin: 5,
    codeSize: 27,
    codesPerRow: 6,
    codesPerColumn: 9,
    showHeader: false,
    showFooter: false
};
