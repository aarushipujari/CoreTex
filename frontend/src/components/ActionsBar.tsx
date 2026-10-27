import { useState } from "react";
import { tempUrl } from "../api";

interface Props {
  texSource: string | null;
  blob: Blob | null;
  filename: string | null;
  overleafTempUrl: string | null;
  disabled?: boolean;
  onCopied: () => void;
}

export function ActionsBar({
  texSource,
  blob,
  filename,
  overleafTempUrl,
  disabled,
  onCopied,
}: Props) {
  const [copying, setCopying] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  const handleDownload = () => {
    if (!blob || !filename) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!texSource) return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(texSource);
      onCopied();
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    } finally {
      setCopying(false);
    }
  };

  const handleOverleaf = () => {
    if (!overleafTempUrl) return;
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isLocalhost) {
      alert(
        "Notice: Because you are running locally (on localhost), Overleaf's internet servers cannot reach into your computer.\n\nTo open in Overleaf:\n1. Click 'Download .zip (with figures)'.\n2. In Overleaf, click 'New Project' -> 'Upload Project' and drop your zip file in!"
      );
      window.open("https://www.overleaf.com/project", "_blank", "noopener,noreferrer");
      return;
    }
    const absoluteTempUrl = new URL(tempUrl(overleafTempUrl), window.location.origin).toString();
    const url = `https://www.overleaf.com/docs?snip_uri=${encodeURIComponent(absoluteTempUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const isZip = filename?.endsWith(".zip");

  return (
    <div className="actions-row" role="group" aria-label="Download actions">
      <button
        className="primary btn-download"
        onClick={handleDownload}
        disabled={disabled || !blob}
        aria-label={isZip ? "Download .zip package" : "Download .tex source"}
      >
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Download {isZip ? ".zip (with figures)" : ".tex"}
      </button>

      <button
        className={`btn-copy ${justCopied ? "btn-copied" : ""}`}
        onClick={handleCopy}
        disabled={disabled || !texSource || copying}
      >
        {justCopied ? (
          <>
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="var(--ok)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {copying ? "Copying…" : "Copy LaTeX"}
          </>
        )}
      </button>

      <button
        className="btn-overleaf"
        onClick={handleOverleaf}
        disabled={disabled || !overleafTempUrl}
        title="Open directly in Overleaf online editor"
      >
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        Open in Overleaf
      </button>
    </div>
  );
}
