import { buildTraineeDisplayName } from "@/features/trainee/traineeDisplay";
import type { ISODateString } from "@/schemas/common.schema";
import type { TraineeListItemDto } from "@/schemas/trainees.schema";
import { formatDayMonth } from "@/shared/formatting/dateFormat";
import AppIcon from "@/shared/icons/AppIcon";
import { buildTraineeLocationLabel } from "../traineesListLogic";
import { TRAINEES_LIST_TEXTS } from "../traineesListTexts";
import TraineePhoto from "./TraineePhoto";

const TEXTS = TRAINEES_LIST_TEXTS.card;

interface TraineeCardProps {
  trainee: TraineeListItemDto;
}

/** כרטיס חניך ברשימה (ספק 01 §3.2) */
export default function TraineeCard({ trainee }: TraineeCardProps) {
  return (
    <article className="rounded-card bg-paper p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <TraineePhoto traineeId={trainee.id} />
          <div className="min-w-0 pt-1">
            <h2 className="truncate text-sm font-medium text-text-primary">{buildTraineeDisplayName(trainee)}</h2>
          </div>
        </div>
        <StatusBadge restrictedUntilDate={trainee.restrictedUntilDate ?? null} />
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

const BADGE_STYLES = {
  active: { container: "bg-success-soft text-success", dot: "bg-success" },
  restricted: { container: "bg-error-soft text-error", dot: "bg-error" },
} as const;

/** תגית "פעיל", או "מוגבל עד DD/MM" כשיש הגבלה פעילה */
function StatusBadge({ restrictedUntilDate }: { restrictedUntilDate: ISODateString | null }) {
  const styles = restrictedUntilDate ? BADGE_STYLES.restricted : BADGE_STYLES.active;

  return (
    <span className={`flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2 text-xs ${styles.container}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${styles.dot}`} />
      {restrictedUntilDate ? (
        <span>
          {TEXTS.restrictedUntil} <span dir="ltr">{formatDayMonth(restrictedUntilDate)}</span>
        </span>
      ) : (
        <span>{TEXTS.activeBadge}</span>
      )}
    </span>
  );
}
