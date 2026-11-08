import { writeBarcode } from "zxing-wasm/writer";
import { configureWriterWasm } from "./ZxingSetup";

export class DataMatrixGenerator {
    static async generate(
        text: string,
        size = 400
    ): Promise<string> {
        if (!text) {
            throw new Error("Es gibt keine Daten zum Codieren.");
        }

        try {
            await configureWriterWasm();

            const result = await writeBarcode(text, {
                format: "DataMatrix",
                sizeHint: size,
                addQuietZones: true
            });

            if (result.error || !result.image) {
                throw new Error(
                    result.error || "Data-Matrix-Bild fehlt."
                );
            }

            return await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();

                reader.onload = () => {
                    if (typeof reader.result !== "string") {
                        reject(
                            new Error("Bild konnte nicht umgewandelt werden.")
                        );
                        return;
                    }

                    resolve(reader.result);
                };

                reader.onerror = () => {
                    reject(new Error("Bild konnte nicht gelesen werden."));
                };

                reader.readAsDataURL(result.image);
            });
        } catch (error) {
            throw new Error(
                error instanceof Error
                    ? error.message
                    : "Data-Matrix-Code konnte nicht generiert werden."
            );
        }
    }
}