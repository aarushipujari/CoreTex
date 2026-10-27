import { useEffect, useState } from "react";
import { ActionsBar } from "../components/ActionsBar";
import { ConversionSummary } from "../components/ConversionSummary";
import { LatexEditor } from "../components/LatexEditor";
import { TemplateSelector } from "../components/TemplateSelector";
import { UploadZone } from "../components/UploadZone";
import { WarningsPanel } from "../components/WarningsPanel";
import { useConversion } from "../hooks/useConversion";
import { useAuth } from "../auth/useAuth";
import type { TemplateChoice } from "../types";

interface Props {
  onToast: (msg: string) => void;
}

export function ConverterPage({ onToast }: Props) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [template, setTemplate] = useState<TemplateChoice>("article");
  const { state, start, reset } = useConversion();

  const isBusy =
    state.phase === "uploading" ||
    state.phase === "polling" ||
    state.phase === "downloading";

  const handleConvert = () => {
    if (file) start(file, template);
  };

  const handleReset = () => {
    setFile(null);
    reset();
  };

  // Show a brief banner when a conversion came from the dedup cache.
  useEffect(() => {
    if (state.cached && state.phase === "done") {
      onToast("Restored from history — identical upload");
    }
  }, [state.cached, state.phase, onToast]);

  // Publish phase + elapsed to the persistent Header (which lives above the router).
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("coretex:phase", {
        detail: { phase: state.phase, elapsedMs: state.elapsedMs },
      })
    );
  }, [state.phase, state.elapsedMs]);

  return (
    <main className="converter-layout">
      {/* ── Left Sidebar / Controls ─────────────────────────── */}
      <section aria-label="Conversion controls" className="stack sidebar-controls">
        {/* Step 1: Upload */}
        <div className="card step-card">
          <div className="card-header">
            <span className="step-num">1</span>
            <h2>Upload Document</h2>
          </div>
          <UploadZone
            onFile={setFile}
            selectedFile={file}
            disabled={isBusy}
            onClear={handleReset}
          />
        </div>

        {/* Step 2: Template */}
        <div className="card step-card">
          <div className="card-header">
            <span className="step-num">2</span>
            <h2>Select Template</h2>
          </div>
          <TemplateSelector value={template} onChange={setTemplate} disabled={isBusy} />
        </div>

        {/* Step 3: Convert Action */}
        <div className="card step-card">
          <div className="card-header">
            <span className="step-num">3</span>
            <h2>Convert & Compile</h2>
          </div>
          <div className="actions-row">
            <button
              className="primary btn-convert"
              onClick={handleConvert}
              disabled={!file || isBusy}
              aria-label="Start conversion"
            >
              {isBusy ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  <span>Converting…</span>
                </>
              ) : (
                <>
                  <span>Convert to LaTeX</span>
                  <span className="arrow-icon" aria-hidden="true">→</span>
                </>
              )}
            </button>
            <button
              className="btn-reset"
              onClick={handleReset}
              disabled={isBusy && state.phase !== "error"}
            >
              Reset
            </button>
          </div>

          {/* Real-time Busy Stepper Tracker */}
          {isBusy && (
            <div className="conversion-progress" aria-live="polite">
              <div className="progress-bar-track">
                <div
                  className={`progress-bar-fill ${
                    state.phase === "uploading"
                      ? "p-upload"
                      : state.phase === "polling"
                      ? "p-poll"
                      : "p-done"
                  }`}
                />
              </div>
              <div className="progress-status-row">
                <span className="progress-label">
                  {state.phase === "uploading" && "Uploading document to server…"}
                  {state.phase === "polling" && "Parsing Word XML & validating TeX Live…"}
                  {state.phase === "downloading" && "Packaging output & figures…"}
                </span>
                <span className="progress-timer">
                  {(state.elapsedMs / 1000).toFixed(1)}s
                </span>
              </div>
            </div>
          )}

          {!user && (
            <div className="signin-banner">
              <span className="info-icon" aria-hidden="true">💡</span>
              <span>
                <a href="/login">Sign in</a> to automatically save papers to your history.
              </span>
            </div>
          )}

          {state.error && (
            <div className="warning error" role="alert" style={{ marginTop: "0.75rem" }}>
              <span className="warning-indicator">✕</span>
              <div className="warning-text">{state.error}</div>
            </div>
          )}
        </div>

        {/* Conversion Summary */}
        <div className="card">
          <div className="card-header">
            <h2>Conversion Summary</h2>
          </div>
          <ConversionSummary summary={state.summary} />
        </div>

        {/* Warnings */}
        <div className="card">
          <div className="card-header">
            <h2>
              Warnings {state.summary && `(${state.summary.warning_count})`}
            </h2>
          </div>
          <WarningsPanel warnings={state.summary?.warnings ?? []} />
        </div>
      </section>

      {/* ── Right Main Editor ───────────────────────────────── */}
      <section aria-label="LaTeX output" className="card editor-wrapper">
        <div className="editor-toolbar">
          <div className="editor-title-wrap">
            <h2 style={{ margin: 0 }}>LaTeX Source</h2>
            {state.texSource && (
              <span className="editor-stats">
                {state.texSource.split("\n").length} lines · {(state.texSource.length / 1024).toFixed(1)} KB
              </span>
            )}
          </div>
          <ActionsBar
            texSource={state.texSource}
            blob={state.downloadBlob}
            filename={state.downloadFilename}
            overleafTempUrl={state.overleafTempUrl}
            disabled={state.phase !== "done"}
            onCopied={() => onToast("Copied to clipboard")}
          />
        </div>

        {state.texSource ? (
          <LatexEditor
            value={state.texSource}
            errorLine={state.summary?.compile_error_line ?? null}
          />
        ) : (
          <div className="editor-shell">
            <div className="editor-empty">
              <div className="empty-content">
                <div className="empty-symbol-badge" aria-hidden="true">
                  <span>∫ ∑ ∇</span>
                </div>
                <h3 className="empty-title">
                  Drop a Word document to inspect compiled LaTeX
                </h3>
                <p className="empty-desc">
                  Syntax-highlighted, validated with TeX Live `pdflatex`, and one click into Overleaf.
                </p>

                <div className="empty-features-grid">
                  <div className="feature-chip">
                    <span className="chip-check">✓</span> Batched OMML equations
                  </div>
                  <div className="feature-chip">
                    <span className="chip-check">✓</span> 140+ Unicode math glyphs
                  </div>
                  <div className="feature-chip">
                    <span className="chip-check">✓</span> IEEE / ACM / Springer styles
                  </div>
                  <div className="feature-chip">
                    <span className="chip-check">✓</span> Embedded figures & EXIF
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
