export class PasswordManager {
    static validate(password: string): {
        valid: boolean;
        message: string;
    } {
        if (password.length < 8) {
            return {
                valid: false,
                message: "Das Passwort muss mindestens 8 Zeichen lang sein."
            };
        }

        if (!/[A-Z]/.test(password)) {
            return {
                valid: false,
                message: "Mindestens ein Großbuchstabe ist erforderlich."
            };
        }

        if (!/[a-z]/.test(password)) {
            return {
                valid: false,
                message: "Mindestens ein Kleinbuchstabe ist erforderlich."
            };
        }

        if (!/[0-9]/.test(password)) {
            return {
                valid: false,
                message: "Mindestens eine Zahl ist erforderlich."
            };
        }

        return {
            valid: true,
            message: "Das Passwort erfüllt die Anforderungen."
        };
    }

    static generateSalt(length = 16): Uint8Array {
        const salt = new Uint8Array(length);
        crypto.getRandomValues(salt);
        return salt;
    }
}
