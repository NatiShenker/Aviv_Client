import type { ReactNode } from "react";
import { IpsButton } from "ui-library";
import Collapsible, { COLLAPSIBLE_MOTION_CLASS } from "@/shared/components/Collapsible";
import AppIcon from "@/shared/icons/AppIcon";
import type { AppIconName } from "@/shared/icons/appIcons";
import DetailGrid from "./DetailGrid";
import { HISTORY_TEXTS } from "./historyTexts";
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
  /** למשל "צור הגבלה חדשה על בסיס זו" */
  createBasedOnLabel: string;
  onCreateBasedOn: () => void;
}

/**
 * כרטיס רשומה בהיסטוריה: סגור - מה ומתי; פתוח - שאר הפרטים, וכפתור "עריכה" או "צור … על בסיס זו" (ספק 00 §3.22).
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
  return (
    <article id={id} className="rounded-card bg-paper p-4">
      <button type="button" aria-expanded={isOpen} onClick={onToggle} className="flex w-full items-center gap-3 text-start">
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

      <Collapsible isOpen={isOpen}>
        <div className="pt-4">
          <DetailGrid items={details} />
          <div className="mt-4">
            {isEnded ? (
              <IpsButton variant="outlined" size="large" fullWidth endIcon={<AppIcon name="copy" />} onClick={onCreateBasedOn}>
                {createBasedOnLabel}
              </IpsButton>
            ) : (
              <IpsButton variant="outlined" size="large" fullWidth endIcon={<AppIcon name="edit" />} onClick={onEdit}>
                {HISTORY_TEXTS.card.edit}
              </IpsButton>
            )}
          </div>
        </div>
      </Collapsible>
    </article>
  );
}
