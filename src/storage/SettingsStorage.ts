import { Database } from "./Database";
import {
    DEFAULT_SETTINGS,
    type AppSettings
} from "../types/Settings";

const SETTINGS_ID = "app-settings";

export class SettingsStorage {
    static async load(): Promise<AppSettings> {
        const settings = await Database.get<AppSettings>(
            "settings",
            SETTINGS_ID
        );

        return settings ?? DEFAULT_SETTINGS;
    }

    static async save(settings: AppSettings): Promise<void> {
        await Database.save("settings", {
            id: SETTINGS_ID,
            ...settings
        });
    }

    static async reset(): Promise<void> {
        await Database.save("settings", {
            id: SETTINGS_ID,
            ...DEFAULT_SETTINGS
        });
    }
}