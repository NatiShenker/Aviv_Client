import TraineeCardMenu from "@/features/trainee-actions/desktop/TraineeCardMenu";
import type { TraineeDrawerScreen } from "@/features/trainee-actions/desktop/traineeDrawerScreens";
import { buildTraineeAccessibleName } from "@/features/trainee/traineeDisplay";
import { FOCUS_RING_CLASS } from "@/shared/components/focusRing";
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
// צבע המסגרת: רגיל, בריחוף, ושל החניך שהמגירה שלו פתוחה.
// לחניך הפתוח גם טבעת של 1px, כדי שיבלוט מאחורי הרקע הכהה של המגירה
const CARD_BORDER_CLASS = "border-divider hover:border-border-strong";
const ACTIVE_CARD_BORDER_CLASS = "border-primary ring-1 ring-primary";

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
      className={`min-h-0 flex-1 overflow-y-auto p-4 ${FOCUS_RING_CLASS}`}
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
          const borderClass = trainee.idntTrainee === activeTraineeId ? ACTIVE_CARD_BORDER_CLASS : CARD_BORDER_CLASS;
          const accessibleName = buildTraineeAccessibleName(trainee);
          return (
            <li key={trainee.idntTrainee} className={`relative transition-colors ${CARD_FRAME_CLASS} ${borderClass}`}>
              {/*
                הכרטיס כולו פותח את המגירה: כפתור שקוף מעליו, כדי שהכרטיס עצמו יישאר זהה למובייל.
                הכפתור לפני הכרטיס, כדי ש-Tab יגיע קודם לכרטיס ואחר כך ל-⋮ שבתוכו; ה-⋮ יושב מעל הכפתור
              */}
              <button
                type="button"
                aria-label={TRAINEES_LIST_TEXTS.openTraineeActions(accessibleName)}
                onClick={() => onOpenTrainee(trainee.idntTrainee)}
                className={`absolute inset-0 cursor-pointer rounded-card ${FOCUS_RING_CLASS}`}
              />
              <TraineeCard
                trainee={trainee}
                menu={
                  <div className="relative z-10 -my-1 -me-2">
                    <TraineeCardMenu
                      traineeAccessibleName={accessibleName}
                      onOpenScreen={(screen) => onOpenTrainee(trainee.idntTrainee, screen)}
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
