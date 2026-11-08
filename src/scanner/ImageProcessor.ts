export class ImageProcessor {
    static async process(
        file: File,
        options: {
            grayscale?: boolean;
            contrast?: number;
            brightness?: number;
            maxWidth?: number;
        } = {}
    ): Promise<File> {
        const image = await createImageBitmap(file);

        const maxWidth = options.maxWidth ?? 2400;
        const scale = Math.min(1, maxWidth / image.width);

        const canvas = document.createElement("canvas");

        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");

        if (!context) {
            image.close();
            throw new Error("Bildverarbeitung nicht verfügbar.");
        }

        context.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
        );

        image.close();

        if (options.grayscale || options.contrast !== undefined) {
            const imageData = context.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            );

            const contrast = options.contrast ?? 1.15;
            const brightness = options.brightness ?? 0;
            const factor =
                (259 * (contrast * 255 + 255)) /
                (255 * (259 - contrast * 255));

            for (
                let index = 0;
                index < imageData.data.length;
                index += 4
            ) {
                const data = imageData.data;

                if (options.grayscale) {
                    const gray =
                        0.299 * data[index] +
                        0.587 * data[index + 1] +
                        0.114 * data[index + 2];

                    data[index] = gray;
                    data[index + 1] = gray;
                    data[index + 2] = gray;
                }

                for (let channel = 0; channel < 3; channel++) {
                    data[index + channel] = Math.max(
                        0,
                        Math.min(
                            255,
                            factor * (data[index + channel] - 128) +
                            128 +
                            brightness
                        )
                    );
                }
            }

            context.putImageData(imageData, 0, 0);
        }

        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(new Error("Verarbeitetes Bild konnte nicht erstellt werden."));
                }
            }, "image/png");
        });

        return new File(
            [blob],
            `${file.name.replace(/\.[^.]+$/, "")}_processed.png`,
            { type: "image/png" }
        );
    }
}