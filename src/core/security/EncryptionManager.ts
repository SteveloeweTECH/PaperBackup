const PBKDF2_ITERATIONS = 310_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

export interface EncryptionResult {
    data: Uint8Array;
    salt: Uint8Array;
    iv: Uint8Array;
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
    const copy = new Uint8Array(data.byteLength);
    copy.set(data);
    return copy.buffer;
}

function createRandomBytes(length: number): Uint8Array {
    if (typeof crypto === "undefined" || !crypto.getRandomValues) {
        throw new Error("Sichere Zufallszahlen sind in dieser Browser-Umgebung nicht verfügbar. Bitte PaperBackup über localhost oder HTTPS öffnen.");
    }

    return crypto.getRandomValues(new Uint8Array(length));
}

export class EncryptionManager {
    static async encrypt(
        data: Uint8Array,
        password: string
    ): Promise<EncryptionResult> {
        if (!password || password.length < 8) {
            throw new Error("Das Passwort muss mindestens 8 Zeichen lang sein.");
        }

        if (typeof crypto === "undefined" || !crypto.subtle) {
            throw new Error("Verschlüsselung benötigt Web Crypto. Öffne PaperBackup über http://localhost oder eine HTTPS-Adresse, nicht über file:// oder eine unsichere HTTP-Verbindung.");
        }

        const salt = createRandomBytes(SALT_LENGTH);
        const iv = createRandomBytes(IV_LENGTH);
        const key = await this.deriveKey(password, salt);

        const encrypted = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: toArrayBuffer(iv) },
            key,
            toArrayBuffer(data)
        );

        return { data: new Uint8Array(encrypted), salt, iv };
    }

    static async decrypt(
        encryptedData: Uint8Array,
        password: string,
        salt: Uint8Array,
        iv: Uint8Array
    ): Promise<Uint8Array> {
        if (!password) {
            throw new Error("Das Passwort fehlt.");
        }
        if (typeof crypto === "undefined" || !crypto.subtle) {
            throw new Error("Entschlüsselung benötigt Web Crypto. Öffne PaperBackup über http://localhost oder eine HTTPS-Adresse.");
        }

        if (salt.length !== SALT_LENGTH || iv.length !== IV_LENGTH) {
            throw new Error("Ungültige Verschlüsselungsdaten.");
        }

        try {
            const key = await this.deriveKey(password, salt);
            const decrypted = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: toArrayBuffer(iv) },
                key,
                toArrayBuffer(encryptedData)
            );

            return new Uint8Array(decrypted);
        } catch {
            throw new Error("Entschlüsselung fehlgeschlagen. Ist das Passwort korrekt?");
        }
    }

    private static async deriveKey(
        password: string,
        salt: Uint8Array
    ): Promise<CryptoKey> {
        const passwordBytes = new TextEncoder().encode(password);
        const passwordKey = await crypto.subtle.importKey(
            "raw",
            toArrayBuffer(passwordBytes),
            "PBKDF2",
            false,
            ["deriveKey"]
        );

        return crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: toArrayBuffer(salt),
                iterations: PBKDF2_ITERATIONS,
                hash: "SHA-256"
            },
            passwordKey,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );
    }
}
