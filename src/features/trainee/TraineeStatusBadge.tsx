import type { ISODateString } from "@/types/common.schema";
import { formatDayMonth } from "@/utils/dates";
import { TRAINEE_TEXTS } from "./traineeTexts";

const TEXTS = TRAINEE_TEXTS.statusBadge;

const BADGE_STYLES = {
  active: { container: "bg-success-soft text-success", dot: "bg-success" },
  restricted: { container: "bg-error-soft text-error", dot: "bg-error" },
} as const;

interface TraineeStatusBadgeProps {
  /** תאריך הסיום של ההגבלה הפעילה, או null כשאין הגבלה */
  restrictedUntilDate: ISODateString | null;
}

/** תגית "פעיל", או "מוגבל עד DD/MM" כשיש הגבלה פעילה - בכרטיס החניך ובכותרת המגירה */
export default function TraineeStatusBadge({ restrictedUntilDate }: TraineeStatusBadgeProps) {
  const styles = restrictedUntilDate ? BADGE_STYLES.restricted : BADGE_STYLES.active;

  return (
    <span className={`flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2 text-xs ${styles.container}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${styles.dot}`} />
      {restrictedUntilDate ? (
        <span>
          {TEXTS.restrictedUntil} <span dir="ltr">{formatDayMonth(restrictedUntilDate)}</span>
        </span>
      ) : (
        <span>{TEXTS.active}</span>
      )}
    </span>
  );
}
