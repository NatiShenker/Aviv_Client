import type { TraineeRestrictionRecordDto } from "@/schemas/trainee-restrictions.schema";
import LoadMoreSentinel from "@/shared/components/LoadMoreSentinel";
import ScreenStateMessage from "@/shared/components/ScreenStateMessage";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import { useIncrementalList } from "@/shared/hooks/useIncrementalList";
import { TRAINEE_RESTRICTIONS_TEXTS } from "../traineeRestrictionsTexts";
import RestrictionCard from "./RestrictionCard";
import RestrictionsSkeleton from "./RestrictionsSkeleton";

const TEXTS = TRAINEE_RESTRICTIONS_TEXTS.states;

interface RestrictionCardsProps {
  /** הרשימה אחרי חיפוש ומיון */
  visibleRecords: TraineeRestrictionRecordDto[];
  openRecordId: number | null;
  onToggleRecord: (recordId: number) => void;
  onEditRecord: (recordId: number) => void;
}

interface RestrictionsListProps extends RestrictionCardsProps {
  restrictions: AsyncResource<TraineeRestrictionRecordDto[]>;
}

/** אזור הכרטיסים: טעינה, שגיאה, ריק, או הכרטיסים עצמם */
export default function RestrictionsList({ restrictions, ...cardsProps }: RestrictionsListProps) {
  switch (restrictions.status) {
    case "idle":
    case "loading":
      return <RestrictionsSkeleton />;
    case "error":
      return (
        <ScreenStateMessage
          tone="error"
          message={TEXTS.loadFailed}
          actionLabel={TEXTS.retry}
          onAction={restrictions.reload}
        />
      );
    case "empty":
      return <ScreenStateMessage message={TEXTS.noResults} />;
    case "success":
      if (cardsProps.visibleRecords.length === 0) {
        return <ScreenStateMessage message={TEXTS.noResults} />;
      }
      return <RestrictionCards {...cardsProps} />;
  }
}

// טעינה הדרגתית: 30 כרטיסים בהתחלה, ועוד 30 בכל הגעה לסוף הרשימה. חיפוש או מיון חדש מתחילים מההתחלה
function RestrictionCards({ visibleRecords, openRecordId, onToggleRecord, onEditRecord }: RestrictionCardsProps) {
  const { visibleItems, hasMore, showMore } = useIncrementalList(visibleRecords);

  return (
    <>
      <ul className="flex flex-col gap-2 px-4">
        {visibleItems.map((record) => (
          <li key={record.id}>
            <RestrictionCard
              record={record}
              isOpen={openRecordId === record.id}
              onToggle={() => onToggleRecord(record.id)}
              onEdit={() => onEditRecord(record.id)}
            />
          </li>
        ))}
      </ul>
      {hasMore && <LoadMoreSentinel renderedCount={visibleItems.length} onVisible={showMore} />}
    </>
  );
}
