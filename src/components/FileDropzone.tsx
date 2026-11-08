import { useRef, useState } from "react";
import { UploadCloud, File, X } from "lucide-react";
import { FileUtils } from "../core/utils/FileUtils";

interface FileDropzoneProps {
    files: File[];
    onChange: (files: File[]) => void;
    multiple?: boolean;
    accept?: string;
}

export default function FileDropzone({
                                         files,
                                         onChange,
                                         multiple = true,
                                         accept
                                     }: FileDropzoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    function addFiles(selected: FileList | null) {
        if (!selected) return;

        const incoming = Array.from(selected);

        onChange(
            multiple
                ? [...files, ...incoming]
                : incoming.slice(0, 1)
        );
    }

    function removeFile(index: number) {
        onChange(files.filter((_, i) => i !== index));
    }

    return (
        <div className="file-dropzone-wrapper">
            <div
                className={`file-dropzone ${dragging ? "dragging" : ""}`}
                onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    addFiles(event.dataTransfer.files);
                }}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    hidden
                    multiple={multiple}
                    accept={accept}
                    onChange={(event) => {
                        addFiles(event.target.files);
                        event.target.value = "";
                    }}
                />

                <div className="dropzone-icon">
                    <UploadCloud size={32} />
                </div>

                <h3>Dateien hier ablegen</h3>
                <p>Oder klicken, um Dateien auszuwählen</p>

                <span className="dropzone-hint">
          {multiple
              ? "Mehrere Dateien möglich"
              : "Eine Datei auswählen"}
        </span>
            </div>

            {files.length > 0 && (
                <div className="selected-files">
                    <div className="selected-files-header">
                        <strong>Ausgewählte Dateien</strong>
                        <span>{files.length} Dateien</span>
                    </div>

                    {files.map((file, index) => (
                        <div
                            className="selected-file"
                            key={`${file.name}-${file.lastModified}-${index}`}
                        >
                            <File size={18} />

                            <div className="selected-file-info">
                                <strong>{file.name}</strong>
                                <small>{FileUtils.formatSize(file.size)}</small>
                            </div>

                            <button
                                type="button"
                                className="icon-button"
                                title="Datei entfernen"
                                aria-label={`${file.name} entfernen`}
                                onClick={() => removeFile(index)}
                            >
                                <X size={17} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}