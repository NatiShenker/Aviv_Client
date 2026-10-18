import type { ReactNode } from "react";
import { IpsButton } from "ui-library";
import Collapsible, { COLLAPSIBLE_MOTION_CLASS } from "@/shared/components/Collapsible";
import AppIcon from "@/shared/icons/AppIcon";
import type { AppIconName } from "@/shared/icons/appIcons";
import DetailGrid, { type DetailItem } from "./DetailGrid";
import { HISTORY_TEXTS } from "./historyTexts";

/** צבע עיגול האייקון: אדום להגבלות והיתרים, כחול להודעות קוליות (ספק 00 §3.20) */
export type RecordIconTone = "danger" | "info";

const ICON_TONE_CLASS: Record<RecordIconTone, string> = {
  danger: "bg-error-soft text-error",
  info: "bg-primary-soft text-primary",
};

interface ExpandableRecordCardProps {
  /** מזהה ה-DOM של הכרטיס, למשל כדי לגלול אליו אחרי שמירה */
  id?: string;
  icon: AppIconName;
  iconTone: RecordIconTone;
  /** השורה העליונה בכרטיס סגור (למשל טווח התאריכים ותגית הסטטוס) */
  summaryTop: ReactNode;
  /** השורה השנייה (למשל הסיבה). נחתכת כשהיא ארוכה */
  summaryText: string;
  details: DetailItem[];
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
}

/** כרטיס רשומה בהיסטוריה: סגור - תקציר; פתוח - כל הפרטים וכפתור "עריכה" (ספק 00 §3.22) */
export default function ExpandableRecordCard({
  id,
  icon,
  iconTone,
  summaryTop,
  summaryText,
  details,
  isOpen,
  onToggle,
  onEdit,
}: ExpandableRecordCardProps) {
  return (
    <article id={id} className="rounded-card bg-paper p-4">
      <button type="button" aria-expanded={isOpen} onClick={onToggle} className="flex w-full items-center gap-3 text-start">
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${ICON_TONE_CLASS[iconTone]}`}>
          <AppIcon name={icon} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center gap-2">{summaryTop}</span>
          <span className="truncate text-base text-text-primary">{summaryText}</span>
        </span>
        {/* החץ מסתובב יחד עם פתיחת התוכן */}
        <AppIcon
          name="chevronDown"
          className={`shrink-0 text-text-primary motion-safe:transition-transform ${COLLAPSIBLE_MOTION_CLASS} ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <Collapsible isOpen={isOpen}>
        <div className="pt-4">
          <DetailGrid items={details} />
          <div className="mt-4">
            <IpsButton variant="outlined" size="large" fullWidth endIcon={<AppIcon name="edit" />} onClick={onEdit}>
              {HISTORY_TEXTS.card.edit}
            </IpsButton>
          </div>
        </div>
      </Collapsible>
    </article>
  );
}
