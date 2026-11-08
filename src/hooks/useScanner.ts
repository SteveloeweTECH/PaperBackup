import { useEffect, useRef, useState } from "react";
import { CameraScanner } from "../scanner/CameraScanner";
import { ScanValidator } from "../scanner/ScanValidator";

export function useScanner() {
    const streamRef = useRef<MediaStream | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scanCount, setScanCount] = useState(0);

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                CameraScanner.stopCamera(streamRef.current);
                streamRef.current = null;
            }
        };
    }, []);

    async function start(video: HTMLVideoElement): Promise<void> {
        try {
            setError(null);
            if (streamRef.current) {
                CameraScanner.stopCamera(streamRef.current);
            }
            streamRef.current = await CameraScanner.startCamera(video);
            setIsRunning(true);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Kamera konnte nicht gestartet werden."
            );
            setIsRunning(false);
        }
    }

    function stop(): void {
        if (streamRef.current) {
            CameraScanner.stopCamera(streamRef.current);
            streamRef.current = null;
        }
        setIsRunning(false);
    }

    async function validateImage(file: File): Promise<void> {
        setError(null);

        try {
            const result = await ScanValidator.validate(file);

            if (!result.valid) {
                setError(result.messages.join(" ") || "Keine gültigen Codes gefunden.");
                return;
            }

            setScanCount(count => count + result.blocksFound);
        } catch {
            setError("Das Bild konnte nicht überprüft werden.");
        }
    }

    return { isRunning, error, scanCount, start, stop, validateImage };
}
