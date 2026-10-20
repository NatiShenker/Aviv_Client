import TraineeCardMenu from "@/features/trainee-actions/desktop/TraineeCardMenu";
import type { TraineeDrawerScreen } from "@/features/trainee-actions/desktop/traineeDrawerScreens";
import { buildTraineeDisplayName } from "@/features/trainee/traineeDisplay";
import LoadMoreSentinel from "@/shared/components/LoadMoreSentinel";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import { useIncrementalList } from "@/shared/hooks/useIncrementalList";
import type { TraineeListItemDto } from "@/types/trainees.schema";
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

/** אזור הכרטיסים - הפוקוס חוזר אליו כשהכרטיס שפתח את המגירה כבר לא מוצג */
export const TRAINEE_CARDS_REGION_ID = "trainee-cards-region";

interface TraineeCardsGridProps {
  hasSelectedInstitute: boolean;
  trainees: AsyncResource<TraineeListItemDto[]>;
  /** הרשימה אחרי חיפוש, סינון ומיון */
  visibleTrainees: TraineeListItemDto[];
  /** החניך שמגירת הפעולות שלו פתוחה, או null */
  activeTraineeId: number | null;
  /** פותח את מגירת החניך: הכרטיס - על מסך הפעולות, תפריט ⋮ - על המסך שנבחר בו */
  onOpenTrainee: (traineeId: number, initialScreen?: TraineeDrawerScreen) => void;
  /** מה מתחיל את הרשימה שוב מ-30 הכרטיסים הראשונים (חיפוש, סינון, מיון) - ולא רענון של אותה רשימה */
  resetVisibleCountOn: readonly unknown[];
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
  resetVisibleCountOn,
}: TraineeCardsGridProps) {
  return (
    <div
      id={TRAINEE_CARDS_REGION_ID}
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
          <CardsGrid
            trainees={traineesToShow}
            activeTraineeId={activeTraineeId}
            onOpenTrainee={onOpenTrainee}
            resetVisibleCountOn={resetVisibleCountOn}
          />
        )}
      />
    </div>
  );
}

type CardsGridProps = Pick<TraineeCardsGridProps, "activeTraineeId" | "onOpenTrainee" | "resetVisibleCountOn"> & {
  trainees: TraineeListItemDto[];
};

// טעינה הדרגתית: 30 כרטיסים בהתחלה, ועוד 30 בכל הגעה לסוף הרשימה. בלי שחזור מיקום בדסקטופ.
// רענון שקט של אותה רשימה (אחרי שמירה במגירה) שומר את הכרטיסים שכבר מוצגים
function CardsGrid({ trainees, activeTraineeId, onOpenTrainee, resetVisibleCountOn }: CardsGridProps) {
  const { visibleItems, hasMore, showMore } = useIncrementalList(trainees, { resetOn: resetVisibleCountOn });

  return (
    <>
      <ul className="grid grid-cols-cards gap-4">
        {visibleItems.map((trainee) => {
          const borderClass = trainee.id === activeTraineeId ? ACTIVE_CARD_BORDER_CLASS : CARD_BORDER_CLASS;
          const displayName = buildTraineeDisplayName(trainee);
          return (
            <li key={trainee.id} className={`relative transition-colors ${CARD_FRAME_CLASS} ${borderClass}`}>
              {/*
                הכרטיס כולו פותח את המגירה: כפתור שקוף מעליו, כדי שהכרטיס עצמו יישאר זהה למובייל.
                הכפתור לפני הכרטיס, כדי ש-Tab יגיע קודם לכרטיס ואחר כך ל-⋮ שבתוכו; ה-⋮ יושב מעל הכפתור
              */}
              <button
                type="button"
                aria-label={TRAINEES_LIST_TEXTS.openTraineeActions(displayName)}
                onClick={() => onOpenTrainee(trainee.id)}
                className="absolute inset-0 cursor-pointer rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              />
              <TraineeCard
                trainee={trainee}
                menu={
                  <div className="relative z-10 -my-1 -me-2">
                    <TraineeCardMenu
                      traineeDisplayName={displayName}
                      onOpenScreen={(screen) => onOpenTrainee(trainee.id, screen)}
                    />
                  </div>
                }
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
