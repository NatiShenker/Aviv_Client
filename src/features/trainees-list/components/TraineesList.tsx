import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/routes";
import type { TraineeListItemDto } from "@/schemas/trainees.schema";
import LoadMoreSentinel from "@/shared/components/LoadMoreSentinel";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import { useIncrementalList } from "@/shared/hooks/useIncrementalList";
import { TRAINEES_LIST_TEXTS } from "../traineesListTexts";
import TraineeCard from "./TraineeCard";
import TraineeCardSkeleton from "./TraineeCardSkeleton";
import TraineesListStates from "./TraineesListStates";

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

/** רשימת החניכים במובייל: עמודה אחת של כרטיסים, וכל כרטיס מוביל למסך הפעולות של החניך */
export default function TraineesList({
  hasSelectedInstitute,
  trainees,
  visibleTrainees,
  restoredVisibleCount,
  onVisibleCountChange,
}: TraineesListProps) {
  return (
    <TraineesListStates
      hasSelectedInstitute={hasSelectedInstitute}
      trainees={trainees}
      visibleTrainees={visibleTrainees}
      loadingContent={<LoadingSkeleton />}
      renderCards={(traineesToShow) => (
        <TraineeCards
          trainees={traineesToShow}
          restoredVisibleCount={restoredVisibleCount}
          onVisibleCountChange={onVisibleCountChange}
        />
      )}
    />
  );
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
