import type { ReactNode } from "react";
import TraineePhoto from "@/features/trainee/TraineePhoto";
import TraineeStatusBadge from "@/features/trainee/TraineeStatusBadge";
import AppIcon from "@/shared/components/AppIcon";
import type { TraineeListItemDto } from "@/types/trainees.schema";
import { buildTraineeLocationLabel } from "../traineesListLogic";
import { TRAINEES_LIST_TEXTS } from "../traineesListTexts";

const TEXTS = TRAINEES_LIST_TEXTS.card;

interface TraineeCardProps {
  trainee: TraineeListItemDto;
  /** תפריט ליד תגית הסטטוס - בדסקטופ תפריט ⋮ (ספק 02 §8.1). במובייל אין */
  menu?: ReactNode;
}

/** כרטיס חניך ברשימה (ספק 01 §3.2) */
export default function TraineeCard({ trainee, menu }: TraineeCardProps) {
  return (
    // group-active: הכהיה ברגע הנגיעה, כשהכרטיס בתוך קישור עם group (במובייל). בדסקטופ אין group, ואין שינוי
    <article className="rounded-card bg-paper p-4 group-active:bg-grey-50">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <TraineePhoto traineeId={trainee.id} />
          {/* השם ומתחתיו המספר: השם מקבל את כל הרוחב ליד התגית, והמספר תמיד קריא (לא נחתך) */}
          <div className="min-w-0 pt-1">
            {/* בשם שנחתך - השם המלא בריחוף */}
            <h2 title={trainee.fullName} className="truncate text-sm font-medium text-text-primary">
              {trainee.fullName}
            </h2>
            <p className="mt-0.5 text-xs text-text-secondary">{trainee.traineeCode}</p>
          </div>
        </div>
        {/* בלי הגבלה אין תגית: המצב הרגיל לא מסומן, כדי שהחניכים המוגבלים יבלטו */}
        <div className="flex shrink-0 items-center gap-1">
          {trainee.restrictedUntilDate && <TraineeStatusBadge restrictedUntilDate={trainee.restrictedUntilDate} />}
          {menu}
        </div>
      </div>

      {/* קו פנימי בהיר מהמסגרת של הכרטיס בדסקטופ, כדי שהכרטיס לא ייקרא כשתי קופסאות (ספק 00 §2.1, border-inner) */}
      <div className="mt-4 border-t border-grey-100" />

      {/* מבנה קבוע בכל רוחב: המיקום מימין והדקות משמאל, והפער (חריג) בשורה משלו רק כשהוא קיים -
          משמאל, מתחת לדקות, כי הוא נוגע ליתרת הדקות שמגיעה מסלקום (הוחלט 2026-10-21).
          האייקונים 16, ביחס לטקסט של 12 */}
      <div className="mt-2 flex flex-col gap-1 text-xs text-text-muted">
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-1">
            <AppIcon name="location" size="small" />
            <span className="truncate">{buildTraineeLocationLabel(trainee)}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <AppIcon name="timer" size="small" />
            {TEXTS.minutes(trainee.remainingMinutes)}
          </span>
        </div>
        {trainee.flags.hasCellcomDiscrepancy && (
          <span className="flex items-center gap-1 self-end text-warning">
            <AppIcon name="warning" size="small" />
            {TEXTS.cellcomDiscrepancy}
          </span>
        )}
      </div>
    </article>
  );
}
