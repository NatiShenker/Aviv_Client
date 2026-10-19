import type { TraineeListItemDto } from "@/schemas/trainees.schema";
import LoadMoreSentinel from "@/shared/components/LoadMoreSentinel";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import { useIncrementalList } from "@/shared/hooks/useIncrementalList";
import TraineeCard from "../components/TraineeCard";
import TraineeCardSkeleton from "../components/TraineeCardSkeleton";
import TraineesListStates from "../components/TraineesListStates";
import { TRAINEES_LIST_TEXTS } from "../traineesListTexts";

// מספיק כדי למלא את אזור הכרטיסים בזמן הטעינה
const SKELETON_CARD_COUNT = 12;
const SKELETON_CARD_KEYS = Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => index);

// הכרטיסים יושבים על משטח לבן, ולכן מקבלים מסגרת (design.md). המסגרת על העוטף, כדי שהכרטיס יישאר זהה למובייל
const CARD_CELL_CLASS = "rounded-card border border-divider";

interface TraineeCardsGridProps {
  hasSelectedInstitute: boolean;
  trainees: AsyncResource<TraineeListItemDto[]>;
  /** הרשימה אחרי חיפוש, סינון ומיון */
  visibleTrainees: TraineeListItemDto[];
}

/**
 * אזור הכרטיסים בדסקטופ - האזור היחיד במסך שגולל.
 * הוא ניתן למיקוד, כדי שאפשר יהיה לגלול גם במקלדת (בשלב הזה הכרטיסים עצמם לא לחיצים)
 */
export default function TraineeCardsGrid({ hasSelectedInstitute, trainees, visibleTrainees }: TraineeCardsGridProps) {
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={TRAINEES_LIST_TEXTS.cardsRegionLabel}
      className="min-h-0 flex-1 overflow-y-auto p-4"
    >
      <TraineesListStates
        hasSelectedInstitute={hasSelectedInstitute}
        trainees={trainees}
        visibleTrainees={visibleTrainees}
        loadingContent={<LoadingGrid />}
        renderCards={(traineesToShow) => <CardsGrid trainees={traineesToShow} />}
      />
    </div>
  );
}

// טעינה הדרגתית: 30 כרטיסים בהתחלה, ועוד 30 בכל הגעה לסוף הרשימה. בלי שחזור מיקום בדסקטופ
function CardsGrid({ trainees }: { trainees: TraineeListItemDto[] }) {
  const { visibleItems, hasMore, showMore } = useIncrementalList(trainees);

  return (
    <>
      <ul className="grid grid-cols-cards gap-4">
        {visibleItems.map((trainee) => (
          <li key={trainee.id} className={CARD_CELL_CLASS}>
            <TraineeCard trainee={trainee} />
          </li>
        ))}
      </ul>
      {hasMore && <LoadMoreSentinel renderedCount={visibleItems.length} onVisible={showMore} />}
    </>
  );
}

function LoadingGrid() {
  return (
    <div role="status" className="grid grid-cols-cards gap-4">
      <span className="sr-only">{TRAINEES_LIST_TEXTS.states.loadingList}</span>
      {SKELETON_CARD_KEYS.map((key) => (
        <div key={key} className={CARD_CELL_CLASS}>
          <TraineeCardSkeleton />
        </div>
      ))}
    </div>
  );
}
