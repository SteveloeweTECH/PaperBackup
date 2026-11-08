
import { prepareZXingModule as prepareReaderModule } from "zxing-wasm/reader";
import { prepareZXingModule as prepareWriterModule } from "zxing-wasm/writer";

let readerPromise: ReturnType<typeof prepareReaderModule> | null = null;
let writerPromise: ReturnType<typeof prepareWriterModule> | null = null;

function locateWasmFile(path: string, prefix: string): string {
    if (path.endsWith(".wasm")) {
        return `${import.meta.env.BASE_URL}wasm/${path.split("/").pop()}`;
    }

    return `${prefix}${path}`;
}

export async function configureReaderWasm(): Promise<void> {
    if (!readerPromise) {
        readerPromise = prepareReaderModule({
            overrides: {
                locateFile: locateWasmFile
            }
        });
    }

    try {
        await readerPromise;
    } catch (error) {
        readerPromise = null;
        throw error;
    }
}

export async function configureWriterWasm(): Promise<void> {
    if (!writerPromise) {
        writerPromise = prepareWriterModule({
            overrides: {
                locateFile: locateWasmFile
            }
        });
    }

    try {
        await writerPromise;
    } catch (error) {
        writerPromise = null;
        throw error;
    }
}
