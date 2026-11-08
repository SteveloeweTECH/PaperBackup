export interface AppSettings {
    theme: "dark" | "light";
    compression: boolean;
    encryption: boolean;
    errorCorrection: "standard" | "high";
    chunkSize: number;
    autoSave: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
    theme: "dark",
    compression: true,
    encryption: false,
    errorCorrection: "standard",
    chunkSize: 256 * 1024,
    autoSave: true
};