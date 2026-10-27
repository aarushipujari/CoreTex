import type { TemplateChoice } from "../types";

export interface TemplateOption {
  value: TemplateChoice;
  label: string;
  badge: string;
  desc: string;
  layout: string;
}

const TEMPLATES: TemplateOption[] = [
  {
    value: "article",
    label: "article",
    badge: "DEFAULT",
    desc: "Default LaTeX class",
    layout: "Standard single column",
  },
  {
    value: "ieee",
    label: "IEEE Transactions",
    badge: "IEEE",
    desc: "IEEEtran journal style",
    layout: "Two-column conference layout",
  },
  {
    value: "acm",
    label: "ACM SIGCONF",
    badge: "ACM",
    desc: "acmart conference proceedings",
    layout: "Double-column proceedings",
  },
  {
    value: "springer",
    label: "Springer LNCS",
    badge: "SPRINGER",
    desc: "llncs lecture notes class",
    layout: "Single-column book style",
  },
  {
    value: "beamer",
    label: "Beamer Slides",
    badge: "SLIDES",
    desc: "presentation deck (one frame per heading)",
    layout: "16:9 presentation deck",
  },
];

interface Props {
  value: TemplateChoice;
  onChange: (v: TemplateChoice) => void;
  disabled?: boolean;
}

export function TemplateSelector({ value, onChange, disabled }: Props) {
  return (
    <fieldset className="template-grid" disabled={disabled} aria-label="Output LaTeX template">
      {TEMPLATES.map((t) => {
        const isSelected = value === t.value;
        return (
          <label
            key={t.value}
            className={`template-card ${isSelected ? "selected" : ""}`}
          >
            <div className="template-card-header">
              <span className={`template-badge ${isSelected ? "badge-active" : ""}`}>
                {t.badge}
              </span>
              <input
                type="radio"
                name="template"
                value={t.value}
                checked={isSelected}
                onChange={() => onChange(t.value)}
                disabled={disabled}
              />
            </div>
            <div className="template-card-body">
              <span className="template-name">{t.label}</span>
              <span className="desc">{t.desc}</span>
            </div>
            <div className="template-layout-tag">{t.layout}</div>
          </label>
        );
      })}
    </fieldset>
  );
}
