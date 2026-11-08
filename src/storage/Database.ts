const DATABASE_NAME = "PaperBackupDB";
const DATABASE_VERSION = 1;

export class Database {
    private static instance: IDBDatabase | null = null;

    static async open(): Promise<IDBDatabase> {
        if (this.instance) {
            return this.instance;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(
                DATABASE_NAME,
                DATABASE_VERSION
            );

            request.onupgradeneeded = () => {
                const database = request.result;

                if (!database.objectStoreNames.contains("backups")) {
                    database.createObjectStore("backups", {
                        keyPath: "id"
                    });
                }

                if (!database.objectStoreNames.contains("settings")) {
                    database.createObjectStore("settings", {
                        keyPath: "id"
                    });
                }
            };

            request.onsuccess = () => {
                this.instance = request.result;

                this.instance.onversionchange = () => {
                    this.instance?.close();
                    this.instance = null;
                };

                resolve(this.instance);
            };

            request.onerror = () => {
                reject(
                    new Error("Die lokale Datenbank konnte nicht geöffnet werden.")
                );
            };
        });
    }

    static async save<T>(
        storeName: string,
        value: T
    ): Promise<void> {
        const database = await this.open();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction(
                storeName,
                "readwrite"
            );

            transaction.objectStore(storeName).put(value);

            transaction.oncomplete = () => resolve();

            transaction.onerror = () => {
                reject(new Error("Speichern fehlgeschlagen."));
            };
        });
    }

    static async get<T>(
        storeName: string,
        id: string
    ): Promise<T | undefined> {
        const database = await this.open();

        return new Promise((resolve, reject) => {
            const request = database
                .transaction(storeName, "readonly")
                .objectStore(storeName)
                .get(id);

            request.onsuccess = () => resolve(request.result as T | undefined);
            request.onerror = () => reject(
                new Error("Daten konnten nicht geladen werden.")
            );
        });
    }

    static async getAll<T>(
        storeName: string
    ): Promise<T[]> {
        const database = await this.open();

        return new Promise((resolve, reject) => {
            const request = database
                .transaction(storeName, "readonly")
                .objectStore(storeName)
                .getAll();

            request.onsuccess = () => resolve(request.result as T[]);
            request.onerror = () => reject(
                new Error("Daten konnten nicht geladen werden.")
            );
        });
    }

    static async delete(
        storeName: string,
        id: string
    ): Promise<void> {
        const database = await this.open();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction(
                storeName,
                "readwrite"
            );

            transaction.objectStore(storeName).delete(id);

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(
                new Error("Löschen fehlgeschlagen.")
            );
        });
    }
}