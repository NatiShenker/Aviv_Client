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
            <h2 className="truncate text-sm font-medium text-text-primary">{trainee.fullName}</h2>
            <p className="mt-0.5 text-xs text-text-secondary">{trainee.traineeCode}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <TraineeStatusBadge restrictedUntilDate={trainee.restrictedUntilDate ?? null} />
          {menu}
        </div>
      </div>

      <div className="mt-4 border-t border-divider" />

      {/* מבנה קבוע בכל רוחב: המיקום מימין והדקות משמאל, והפער (חריג) בשורה משלו רק כשהוא קיים */}
      <div className="mt-2 flex flex-col gap-1 text-xs text-text-muted">
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-1">
            <AppIcon name="location" />
            <span className="truncate">{buildTraineeLocationLabel(trainee)}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <AppIcon name="timer" />
            {TEXTS.minutes(trainee.remainingMinutes)}
          </span>
        </div>
        {trainee.flags.hasCellcomDiscrepancy && (
          <span className="flex items-center gap-1 text-warning">
            <AppIcon name="warning" />
            {TEXTS.cellcomDiscrepancy}
          </span>
        )}
      </div>
    </article>
  );
}
