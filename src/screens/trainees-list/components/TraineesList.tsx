import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/routes";
import type { TraineeListItemDto } from "@/schemas/trainees.schema";
import LoadMoreSentinel from "@/shared/components/LoadMoreSentinel";
import ScreenStateMessage from "@/shared/components/ScreenStateMessage";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import { useIncrementalList } from "@/shared/hooks/useIncrementalList";
import { TRAINEES_LIST_TEXTS } from "../traineesListTexts";
import TraineeCard from "./TraineeCard";

const TEXTS = TRAINEES_LIST_TEXTS.states;

const SKELETON_CARD_COUNT = 4;
const SKELETON_CARD_KEYS = Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => index);

interface TraineesListProps {
  hasSelectedInstitute: boolean;
  trainees: AsyncResource<TraineeListItemDto[]>;
  /** הרשימה אחרי חיפוש, סינון ומיון */
  visibleTrainees: TraineeListItemDto[];
  /** כמה כרטיסים הוצגו כשעזבו את המסך, כדי לשחזר אותם בחזרה */
  restoredVisibleCount: number | null;
  onVisibleCountChange: (visibleCount: number) => void;
}

/** אזור הרשימה: בחירת פנימייה, טעינה, שגיאה, ריק, או הכרטיסים */
export default function TraineesList({
  hasSelectedInstitute,
  trainees,
  visibleTrainees,
  restoredVisibleCount,
  onVisibleCountChange,
}: TraineesListProps) {
  if (!hasSelectedInstitute) {
    return <ScreenStateMessage message={TEXTS.selectInstitute} />;
  }

  switch (trainees.status) {
    case "idle":
    case "loading":
      return <LoadingSkeleton />;
    case "error":
      return (
        <ScreenStateMessage
          tone="error"
          message={TEXTS.loadFailed}
          actionLabel={TEXTS.retry}
          onAction={trainees.reload}
        />
      );
    case "empty":
      return <ScreenStateMessage message={TEXTS.noResults} />;
    case "success":
      if (visibleTrainees.length === 0) {
        return <ScreenStateMessage message={TEXTS.noResults} />;
      }
      return (
        <TraineeCards
          trainees={visibleTrainees}
          restoredVisibleCount={restoredVisibleCount}
          onVisibleCountChange={onVisibleCountChange}
        />
      );
  }
}

interface TraineeCardsProps {
  trainees: TraineeListItemDto[];
  restoredVisibleCount: number | null;
  onVisibleCountChange: (visibleCount: number) => void;
}

// טעינה הדרגתית: 30 כרטיסים בהתחלה, ועוד 30 בכל הגעה לסוף הרשימה
function TraineeCards({ trainees, restoredVisibleCount, onVisibleCountChange }: TraineeCardsProps) {
  const { visibleItems, hasMore, showMore } = useIncrementalList(trainees, {
    initialVisibleCount: restoredVisibleCount,
  });

  const onVisibleCountChangeRef = useRef(onVisibleCountChange);
  onVisibleCountChangeRef.current = onVisibleCountChange;
  useEffect(() => {
    onVisibleCountChangeRef.current(visibleItems.length);
  }, [visibleItems.length]);

  return (
    <>
      <ul className="flex flex-col gap-3 px-5">
        {visibleItems.map((trainee) => (
          <li key={trainee.id}>
            <Link to={ROUTES.traineeActions(trainee.id)} className="block">
              <TraineeCard trainee={trainee} />
            </Link>
          </li>
        ))}
      </ul>
      {hasMore && <LoadMoreSentinel renderedCount={visibleItems.length} onVisible={showMore} />}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-3 px-5">
      <span className="sr-only">{TEXTS.loadingList}</span>
      {SKELETON_CARD_KEYS.map((key) => (
        <TraineeCardSkeleton key={key} />
      ))}
    </div>
  );
}

// שלד בצורת כרטיס חניך. ההבהוב פועל רק כשהמשתמש לא ביקש להפחית תנועה
function TraineeCardSkeleton() {
  return (
    <div aria-hidden="true" className="rounded-card bg-paper p-4 motion-safe:animate-pulse">
      <div className="flex items-start gap-3">
        <div className="size-15 shrink-0 rounded-input bg-grey-100" />
        <div className="flex flex-1 flex-col gap-2 pt-1">
          <div className="h-4 w-2/3 rounded-sm bg-grey-100" />
          <div className="h-3 w-1/4 rounded-sm bg-grey-100" />
        </div>
      </div>
      <div className="mt-4 border-t border-divider" />
      <div className="mt-2 h-3 w-1/2 rounded-sm bg-grey-100" />
    </div>
  );
}
