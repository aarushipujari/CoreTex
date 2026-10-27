import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";

const MAX_BYTES = 20 * 1024 * 1024;

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
  selectedFile: File | null;
  onClear?: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function UploadZone({ onFile, disabled, selectedFile, onClear }: Props) {
  const [error, setError] = useState<string | null>(null);

  const handleDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      setError(null);
      if (rejections.length > 0) {
        const r = rejections[0];
        if (r.errors.some((e) => e.code === "file-too-large")) {
          setError("File is larger than 20 MB.");
        } else if (r.errors.some((e) => e.code === "file-invalid-type")) {
          setError("Only .docx files are accepted.");
        } else {
          setError("File rejected.");
        }
        return;
      }
      const file = accepted[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".docx")) {
        setError("Only .docx files are accepted.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("File is larger than 20 MB.");
        return;
      }
      onFile(file);
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    maxSize: MAX_BYTES,
    disabled,
  });

  return (
    <div className="upload-container">
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? "active" : ""}`}
          role="button"
          aria-label="Upload a .docx file. Drag and drop or click to browse."
          tabIndex={0}
        >
          <input {...getInputProps()} aria-label="File input" />
          <div className="dropzone-icon-wrap" aria-hidden="true">
            <svg
              className="dropzone-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <polyline points="9 15 12 12 15 15" />
            </svg>
          </div>
          <div className="dropzone-text">
            <div className="big">
              {isDragActive ? "Drop the .docx here" : "Drag & drop a .docx, or click to browse"}
            </div>
            <div className="small">Maximum 20 MB · Word documents only</div>
          </div>
          <div className="dropzone-meta">
            <span className="file-badge">.DOCX</span>
            <span>Fast academic conversion</span>
          </div>
        </div>
      ) : (
        <div className="selected-file-card" aria-live="polite">
          <div className="selected-file-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </div>
          <div className="selected-file-details">
            <div className="selected-file-name" title={selectedFile.name}>
              {selectedFile.name}
            </div>
            <div className="selected-file-meta">
              <span>{formatBytes(selectedFile.size)}</span>
              <span className="dot-sep">•</span>
              <span className="status-ready">
                <span className="status-ready-dot" /> Ready to convert
              </span>
            </div>
          </div>
          {onClear && (
            <button
              type="button"
              className="file-remove-btn"
              onClick={onClear}
              disabled={disabled}
              title="Remove file"
              aria-label="Remove selected file"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="warning error" role="alert" style={{ marginTop: "0.6rem" }}>
          {error}
        </div>
      )}
    </div>
  );
}
