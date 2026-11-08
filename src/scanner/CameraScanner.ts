export class CameraScanner {
    static async startCamera(
        video: HTMLVideoElement
    ): Promise<MediaStream> {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error("Kamerazugriff wird nicht unterstützt.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment",
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        });

        video.srcObject = stream;
        video.playsInline = true;

        await video.play();

        return stream;
    }

    static stopCamera(stream: MediaStream): void {
        stream.getTracks().forEach((track) => track.stop());
    }

    static async capture(
        video: HTMLVideoElement
    ): Promise<File> {
        if (!video.videoWidth || !video.videoHeight) {
            throw new Error("Die Kamera ist noch nicht bereit.");
        }

        const canvas = document.createElement("canvas");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error("Bildverarbeitung nicht verfügbar.");
        }

        context.drawImage(video, 0, 0);

        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(new Error("Foto konnte nicht aufgenommen werden."));
                }
            }, "image/png");
        });

        return new File(
            [blob],
            `PaperBackup_Scan_${Date.now()}.png`,
            { type: "image/png" }
        );
    }
}