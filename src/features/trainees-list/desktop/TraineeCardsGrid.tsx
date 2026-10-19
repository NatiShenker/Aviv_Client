import { buildTraineeDisplayName } from "@/features/trainee/traineeDisplay";
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
const CARD_FRAME_CLASS = "rounded-card border";
// צבע המסגרת: רגיל, בריחוף, ושל החניך שהמגירה שלו פתוחה
const CARD_BORDER_CLASS = "border-divider hover:border-border-strong";
const ACTIVE_CARD_BORDER_CLASS = "border-primary";

interface TraineeCardsGridProps {
  hasSelectedInstitute: boolean;
  trainees: AsyncResource<TraineeListItemDto[]>;
  /** הרשימה אחרי חיפוש, סינון ומיון */
  visibleTrainees: TraineeListItemDto[];
  /** החניך שמגירת הפעולות שלו פתוחה, או null */
  activeTraineeId: number | null;
  /** לחיצה על כרטיס פותחת את מגירת הפעולות של החניך */
  onOpenTrainee: (traineeId: number) => void;
}

/**
 * אזור הכרטיסים בדסקטופ - האזור היחיד במסך שגולל.
 * הוא ניתן למיקוד, כדי שאפשר יהיה לגלול גם במקלדת
 */
export default function TraineeCardsGrid({
  hasSelectedInstitute,
  trainees,
  visibleTrainees,
  activeTraineeId,
  onOpenTrainee,
}: TraineeCardsGridProps) {
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
        renderCards={(traineesToShow) => (
          <CardsGrid trainees={traineesToShow} activeTraineeId={activeTraineeId} onOpenTrainee={onOpenTrainee} />
        )}
      />
    </div>
  );
}

type CardsGridProps = Pick<TraineeCardsGridProps, "activeTraineeId" | "onOpenTrainee"> & {
  trainees: TraineeListItemDto[];
};

// טעינה הדרגתית: 30 כרטיסים בהתחלה, ועוד 30 בכל הגעה לסוף הרשימה. בלי שחזור מיקום בדסקטופ
function CardsGrid({ trainees, activeTraineeId, onOpenTrainee }: CardsGridProps) {
  const { visibleItems, hasMore, showMore } = useIncrementalList(trainees);

  return (
    <>
      <ul className="grid grid-cols-cards gap-4">
        {visibleItems.map((trainee) => {
          const borderClass = trainee.id === activeTraineeId ? ACTIVE_CARD_BORDER_CLASS : CARD_BORDER_CLASS;
          return (
            <li key={trainee.id} className={`relative transition-colors ${CARD_FRAME_CLASS} ${borderClass}`}>
              <TraineeCard trainee={trainee} />
              {/* הכרטיס כולו פותח את המגירה: כפתור שקוף מעליו, כדי שהכרטיס עצמו יישאר זהה למובייל */}
              <button
                type="button"
                aria-label={TRAINEES_LIST_TEXTS.openTraineeActions(buildTraineeDisplayName(trainee))}
                onClick={() => onOpenTrainee(trainee.id)}
                className="absolute inset-0 cursor-pointer rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              />
            </li>
          );
        })}
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
        <div key={key} className={`${CARD_FRAME_CLASS} border-divider`}>
          <TraineeCardSkeleton />
        </div>
      ))}
    </div>
  );
}
