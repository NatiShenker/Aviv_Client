import { useId, type ReactNode } from "react";
import Collapsible, { COLLAPSIBLE_MOTION_CLASS } from "@/shared/components/Collapsible";
import ErrorText from "@/shared/components/form/ErrorText";
import AppIcon from "@/shared/icons/AppIcon";

interface ConditionAccordionProps {
  title: string;
  /** הערך הנוכחי בקצרה, ליד הכותרת (למשל "16:00-18:00" או "2 מכשירים") */
  summary: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  /** מוצגת תמיד מתחת לאקורדיון, גם כשהוא סגור */
  error?: string;
  children: ReactNode;
}

/** תנאי בטופס (שעות או מכשירים מותרים): שורה עם תקציר, שנפתחת לשדות עצמם (ספק 00 §3.10) */
export default function ConditionAccordion({ title, summary, isOpen, onToggle, error, children }: ConditionAccordionProps) {
  const contentId = useId();

  return (
    <div>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={onToggle}
        className="flex h-11 w-full cursor-pointer items-center gap-2 text-start text-sm text-text-primary"
      >
        <span className="shrink-0">{title}</span>
        <span className="min-w-0 flex-1 truncate text-text-muted">{summary}</span>
        <AppIcon
          name="chevronDown"
          className={`shrink-0 motion-safe:transition-transform ${COLLAPSIBLE_MOTION_CLASS} ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <Collapsible id={contentId} isOpen={isOpen}>
        <div className="pb-2">{children}</div>
      </Collapsible>
      <ErrorText message={error} />
    </div>
  );
}
