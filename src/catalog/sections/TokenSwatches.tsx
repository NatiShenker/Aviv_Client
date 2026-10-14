import CatalogSection from "../CatalogSection";
import { CATALOG_TEXTS } from "../catalogTexts";

// שמות המחלקות כתובים במלואם, כי Tailwind מזהה רק מחלקות שמופיעות כמחרוזת שלמה בקוד
const TOKEN_SWATCHES = [
  { token: "primary", className: "bg-primary" },
  { token: "primary-light", className: "bg-primary-light" },
  { token: "primary-dark", className: "bg-primary-dark" },
  { token: "secondary-light", className: "bg-secondary-light" },
  { token: "error", className: "bg-error" },
  { token: "warning", className: "bg-warning" },
  { token: "success", className: "bg-success" },
  { token: "info", className: "bg-info" },
  { token: "text-secondary", className: "bg-text-secondary" },
  { token: "background", className: "bg-background" },
  { token: "divider", className: "bg-divider" },
  { token: "grey-300", className: "bg-grey-300" },
  { token: "text-muted", className: "bg-text-muted" },
  { token: "border-strong", className: "bg-border-strong" },
  { token: "primary-soft", className: "bg-primary-soft" },
  { token: "success-soft", className: "bg-success-soft" },
  { token: "error-soft", className: "bg-error-soft" },
] as const;

export default function TokenSwatches() {
  return (
    <CatalogSection title={CATALOG_TEXTS.sectionTitles.tokens}>
      <ul className="grid grid-cols-3 gap-3">
        {TOKEN_SWATCHES.map(({ token, className }) => (
          <li key={token} className="flex flex-col gap-1">
            <span className={`h-10 rounded-base border border-divider ${className}`} />
            <span dir="ltr" className="text-start text-xs text-text-muted">
              {token}
            </span>
          </li>
        ))}
      </ul>
    </CatalogSection>
  );
}
