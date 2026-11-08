import { readBarcodes, type ReaderOptions } from "zxing-wasm/reader";
import { configureReaderWasm } from "./ZxingSetup";

export class DataMatrixReader {
    private static readonly readerOptions: ReaderOptions = {
        formats: ["DataMatrix"],
        tryHarder: true,
        tryRotate: true,
        tryInvert: true,
        tryDownscale: true,
        tryDenoise: true,
        maxNumberOfSymbols: 255
    };

    static async read(file: File): Promise<string[]> {
        if (!file) {
            throw new Error("Keine Datei ausgewählt.");
        }

        const isPdf =
            file.type === "application/pdf" ||
            file.name.toLowerCase().endsWith(".pdf");

        if (isPdf) {
            return this.readPdf(file);
        }

        const supportedTypes = [
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/bmp"
        ];

        if (file.type && !supportedTypes.includes(file.type)) {
            throw new Error(
                "Nicht unterstütztes Dateiformat. Bitte ein Bild oder PDF auswählen."
            );
        }

        return this.readImage(file);
    }

    private static async readImage(file: File): Promise<string[]> {
        await configureReaderWasm();

        let results = await readBarcodes(
            file,
            this.readerOptions
        );

        let values = results
            .map(result => result.text)
            .filter((text): text is string => Boolean(text));

        if (values.length === 0) {
            const { ImageProcessor } = await import(
                "../../scanner/ImageProcessor"
                );

            const processed = await ImageProcessor.process(file, {
                grayscale: true,
                contrast: 1.25,
                brightness: 4,
                maxWidth: 5000
            });

            results = await readBarcodes(
                processed,
                this.readerOptions
            );

            values = results
                .map(result => result.text)
                .filter((text): text is string => Boolean(text));
        }

        return Array.from(new Set(values));
    }

    private static async readPdf(file: File): Promise<string[]> {
        await configureReaderWasm();

        const pdfjs = await import("pdfjs-dist");

        const workerUrl = (
            await import("pdfjs-dist/build/pdf.worker.min.mjs?url")
        ).default;

        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

        const loadingTask = pdfjs.getDocument({
            data: await file.arrayBuffer()
        });

        const allValues = new Set<string>();

        try {
            const pdf = await loadingTask.promise;

            for (
                let pageNumber = 1;
                pageNumber <= pdf.numPages;
                pageNumber++
            ) {
                const page = await pdf.getPage(pageNumber);

                let canvas: HTMLCanvasElement | null =
                    document.createElement("canvas");

                try {
                    const scales = [2, 3];

                    for (const scale of scales) {
                        const viewport = page.getViewport({ scale });

                        const context = canvas.getContext("2d", {
                            alpha: false
                        });

                        if (!context) {
                            throw new Error(
                                "PDF-Seite konnte nicht gerendert werden."
                            );
                        }

                        canvas.width = Math.ceil(viewport.width);
                        canvas.height = Math.ceil(viewport.height);

                        await page.render({
                            canvas,
                            canvasContext: context,
                            viewport
                        }).promise;

                        const blob = await new Promise<Blob>(
                            (resolve, reject) => {
                                canvas!.toBlob(
                                    result => {
                                        if (result) {
                                            resolve(result);
                                        } else {
                                            reject(
                                                new Error(
                                                    "PDF-Seite konnte nicht als Bild verarbeitet werden."
                                                )
                                            );
                                        }
                                    },
                                    "image/png"
                                );
                            }
                        );

                        const imageFile = new File(
                            [blob],
                            `${file.name}-seite-${pageNumber}.png`,
                            { type: "image/png" }
                        );

                        const values = await this.readImage(imageFile);

                        values.forEach(value => allValues.add(value));

                        if (values.length > 0) {
                            break;
                        }

                        canvas.width = 0;
                        canvas.height = 0;
                    }
                } finally {
                    if (canvas) {
                        canvas.width = 0;
                        canvas.height = 0;
                        canvas = null;
                    }

                    page.cleanup();
                }
            }
        } finally {
            await loadingTask.destroy();
        }

        return Array.from(allValues);
    }
}