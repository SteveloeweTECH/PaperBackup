export class FormatUtils {
    static formatDate(value: string | Date): string {
        const date = value instanceof Date
            ? value
            : new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Unbekannt";
        }

        return new Intl.DateTimeFormat("de-DE", {
            dateStyle: "medium",
            timeStyle: "short"
        }).format(date);
    }

    static formatNumber(value: number): string {
        return new Intl.NumberFormat("de-DE").format(value);
    }

    static formatDuration(milliseconds: number): string {
        const seconds = Math.floor(milliseconds / 1000);

        if (seconds < 60) {
            return `${seconds} Sekunden`;
        }

        const minutes = Math.floor(seconds / 60);

        if (minutes < 60) {
            return `${minutes} Minuten`;
        }

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        return `${hours} Std. ${remainingMinutes} Min.`;
    }
}