import { useId, type ReactNode } from "react";
import { IpsButton } from "ui-library";
import AppIcon from "@/shared/components/AppIcon";
import Collapsible, { COLLAPSIBLE_MOTION_CLASS } from "@/shared/components/Collapsible";
import { FOCUS_RING_CLASS } from "@/shared/components/focusRing";
import type { AppIconName } from "@/shared/components/appIcons";
import { HISTORY_TEXTS } from "../historyTexts";
import DetailGrid from "./DetailGrid";
import type { DetailItem } from "./recordDetails";
import RecordIconCircle, { type RecordIconTone } from "./RecordIconCircle";

interface ExpandableRecordCardProps {
  /** מזהה ה-DOM של הכרטיס, למשל כדי לגלול אליו אחרי שמירה */
  id?: string;
  icon: AppIconName;
  iconTone: RecordIconTone;
  /** השורה הראשית - מה הרשומה עושה (למשל סוג ההגבלה, או המספר). טקסט ארוך נחתך */
  summaryTitle: ReactNode;
  /** שורת המשנה - מתי (טווח התאריכים ותגית הסטטוס) */
  summaryMeta: ReactNode;
  /** הפרטים בכרטיס פתוח: רק מה שלא מופיע כבר בשתי השורות, בסדר של הטופס */
  details: DetailItem[];
  isOpen: boolean;
  onToggle: () => void;
  /** רשומה שהסתיימה לא נערכת; במקום "עריכה" אפשר ליצור רשומה חדשה על בסיסה */
  isEnded: boolean;
  onEdit: () => void;
  /** למשל "יצירת הגבלה דומה" */
  createBasedOnLabel: string;
  onCreateBasedOn: () => void;
}

/**
 * כרטיס רשומה בהיסטוריה: סגור - מה ומתי; פתוח - שאר הפרטים, וכפתור "עריכה" או "יצירת … דומה" (ספק 00 §3.22).
 * שתי שורות התקציר נשארות גלויות גם כשהכרטיס פתוח, ולכן הפרטים לא חוזרים עליהן.
 */
export default function ExpandableRecordCard({
  id,
  icon,
  iconTone,
  summaryTitle,
  summaryMeta,
  details,
  isOpen,
  onToggle,
  isEnded,
  onEdit,
  createBasedOnLabel,
  onCreateBasedOn,
}: ExpandableRecordCardProps) {
  const contentId = useId();

  return (
    <article id={id} className="rounded-card bg-paper p-4">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={onToggle}
        className={`flex w-full cursor-pointer items-center gap-3 rounded-input text-start ${FOCUS_RING_CLASS}`}
      >
        <RecordIconCircle icon={icon} tone={iconTone} />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex min-w-0 items-center gap-2 text-base text-text-primary">{summaryTitle}</span>
          <span className="flex min-w-0 items-center gap-2 text-base text-text-muted">{summaryMeta}</span>
        </span>
        {/* החץ מסתובב יחד עם פתיחת התוכן */}
        <AppIcon
          name="chevronDown"
          className={`shrink-0 text-text-primary motion-safe:transition-transform ${COLLAPSIBLE_MOTION_CLASS} ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <Collapsible id={contentId} isOpen={isOpen}>
        <div className="pt-4">
          <DetailGrid items={details} />
          {/* פעולה משנית בכרטיס: כפתור טקסט בקצה, אחרי קו, ולא כפתור מתאר ברוחב מלא שחוזר בכל כרטיס */}
          <div className="mt-4 flex justify-end border-t border-divider pt-1">
            {isEnded ? (
              <IpsButton variant="text" endIcon={<AppIcon name="copy" />} onClick={onCreateBasedOn}>
                {createBasedOnLabel}
              </IpsButton>
            ) : (
              <IpsButton variant="text" endIcon={<AppIcon name="edit" />} onClick={onEdit}>
                {HISTORY_TEXTS.card.edit}
              </IpsButton>
            )}
          </div>
        </div>
      </Collapsible>
    </article>
  );
}
