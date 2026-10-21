import type { ISODateString } from "@/types/common.schema";
import { formatDayMonth } from "@/utils/dates";
import { TRAINEE_TEXTS } from "./traineeTexts";

const TEXTS = TRAINEE_TEXTS.statusBadge;

interface TraineeStatusBadgeProps {
  /** תאריך הסיום של ההגבלה הפעילה */
  restrictedUntilDate: ISODateString;
}

/**
 * תגית "מוגבל עד DD/MM" בכרטיס החניך. מוצגת רק כשיש הגבלה פעילה: חניך בלי הגבלה הוא המצב הרגיל,
 * ולכן אין לו תגית - כך החניכים המוגבלים בולטים ברשימה (הוחלט 2026-10-21)
 */
export default function TraineeStatusBadge({ restrictedUntilDate }: TraineeStatusBadgeProps) {
  return (
    <span className="flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-error-soft px-2 text-xs text-error">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-error" />
      <span>
        {TEXTS.restrictedUntil} <span dir="ltr">{formatDayMonth(restrictedUntilDate)}</span>
      </span>
    </span>
  );
}
