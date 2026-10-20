import LoadMoreSentinel from "@/shared/components/LoadMoreSentinel";
import { useIncrementalList } from "@/shared/hooks/useIncrementalList";
import { RESTRICTION_PICKER_HEADING_ID } from "../form/numberRecordFormLogic";
import type { RestrictionOptionsListProps } from "../form/source-restriction/RestrictionPicker";
import RestrictionOptionCard from "./RestrictionOptionCard";

/**
 * ההגבלות לבחירה במובייל: כרטיסי מידע עם שורת "בחירה" בתחתית (ספק 04 form §3.2.1).
 * טעינה הדרגתית, כמו בשאר הרשימות: 30 כרטיסים, ועוד 30 בכל הגעה לסוף
 */
export default function RestrictionOptionCards({
  restrictions,
  selectedRestrictionId,
  isChoosing,
  hintId,
  onChoose,
}: RestrictionOptionsListProps) {
  const { visibleItems, hasMore, showMore } = useIncrementalList(restrictions);

  return (
    <>
      <ul aria-labelledby={RESTRICTION_PICKER_HEADING_ID} aria-describedby={hintId} className="mt-2 flex flex-col gap-2">
        {visibleItems.map((restriction) => (
          <li key={restriction.restrictionId}>
            <RestrictionOptionCard
              restriction={restriction}
              isSelected={restriction.restrictionId === selectedRestrictionId}
              isChoosing={isChoosing}
              onChoose={() => onChoose(restriction)}
            />
          </li>
        ))}
      </ul>
      {hasMore && <LoadMoreSentinel renderedCount={visibleItems.length} onVisible={showMore} />}
    </>
  );
}
