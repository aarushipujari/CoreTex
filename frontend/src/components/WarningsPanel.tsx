interface Props {
  warnings: string[];
}

function classify(w: string): "citation" | "error" | "" {
  if (w.includes("[CITATION]")) return "citation";
  if (/fail/i.test(w)) return "error";
  return "";
}

export function WarningsPanel({ warnings }: Props) {
  if (warnings.length === 0) {
    return (
      <div className="warning-empty clean-state">
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="var(--ok)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>No warnings. Clean conversion.</span>
      </div>
    );
  }
  return (
    <div className="warnings" role="region" aria-live="polite" aria-label="Conversion warnings">
      {warnings.map((w, i) => {
        const kind = classify(w);
        return (
          <div key={i} className={`warning ${kind}`}>
            <span className="warning-indicator" aria-hidden="true">
              {kind === "citation" ? "📖" : kind === "error" ? "✕" : "⚠"}
            </span>
            <div className="warning-text">{w}</div>
          </div>
        );
      })}
    </div>
  );
}
