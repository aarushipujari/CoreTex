import type { ResultSummary } from "../types";

interface Props {
  summary: ResultSummary | null;
}

export function ConversionSummary({ summary }: Props) {
  if (!summary) {
    return (
      <div className="warning-empty summary-empty">
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>No conversion run yet.</span>
      </div>
    );
  }
  return (
    <div className="summary-grid">
      <div className="item">
        <div className="label">
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Template
        </div>
        <div className="value template-val">{summary.template}</div>
      </div>
      <div className="item">
        <div className="label">
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Compile
        </div>
        <div
          className={`value status-pill-text ${summary.compile_ok ? "compile-ok" : "compile-fail"}`}
        >
          <span className="dot" />
          {summary.compile_ok ? "OK" : "FAIL"}
        </div>
      </div>
      <div className="item">
        <div className="label">
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          Images
        </div>
        <div className="value">{summary.has_images ? "Bundled" : "None"}</div>
      </div>
      <div className="item">
        <div className="label">
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          Citations
        </div>
        <div className="value">{summary.citation_count}</div>
      </div>
      <div className="item">
        <div className="label">
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Warnings
        </div>
        <div className="value">{summary.warning_count}</div>
      </div>
      {summary.compile_error_line !== null && (
        <div className="item error-line-item">
          <div className="label">
            <svg
              viewBox="0 0 24 24"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Error line
          </div>
          <div className="value error-val">Line {summary.compile_error_line}</div>
        </div>
      )}
    </div>
  );
}
