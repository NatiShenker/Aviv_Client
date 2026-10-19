import type { ReactNode } from "react";
import { buildTraineeDisplayName } from "@/features/trainee/traineeDisplay";
import type { TraineeListItemDto } from "@/schemas/trainees.schema";
import AppIcon from "@/shared/icons/AppIcon";
import { buildTraineeLocationLabel } from "../traineesListLogic";
import { TRAINEES_LIST_TEXTS } from "../traineesListTexts";
import TraineePhoto from "./TraineePhoto";
import TraineeStatusBadge from "./TraineeStatusBadge";

const TEXTS = TRAINEES_LIST_TEXTS.card;

interface TraineeCardProps {
  trainee: TraineeListItemDto;
  /** תפריט ליד תגית הסטטוס - בדסקטופ תפריט ⋮ (ספק 02 §8.1). במובייל אין */
  menu?: ReactNode;
}

/** כרטיס חניך ברשימה (ספק 01 §3.2) */
export default function TraineeCard({ trainee, menu }: TraineeCardProps) {
  return (
    <article className="rounded-card bg-paper p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <TraineePhoto traineeId={trainee.id} />
          <div className="min-w-0 pt-1">
            <h2 className="truncate text-sm font-medium text-text-primary">{buildTraineeDisplayName(trainee)}</h2>
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
