import { useId, useMemo } from "react";
import { IpsButton } from "ui-library";
import type { SourceRestrictionSummaryDto } from "@/schemas/phone-exceptions.schema";
import ErrorText from "@/shared/components/form/ErrorText";
import LoadMoreSentinel from "@/shared/components/LoadMoreSentinel";
import { useIncrementalList } from "@/shared/hooks/useIncrementalList";
import { NUMBER_RESTRICTIONS_TEXTS } from "../numberRestrictionsTexts";
import { NUMBER_RECORD_FIELD_IDS, RESTRICTION_PICKER_HEADING_ID } from "./numberRecordFormLogic";
import RestrictionOptionCard from "./RestrictionOptionCard";
import { buildRestrictionPickerView } from "./restrictionPickerLogic";
import type { NumberRecordForm } from "./useNumberRecordForm";

const TEXTS = NUMBER_RESTRICTIONS_TEXTS.form.picker;

interface RestrictionPickerProps {
  form: NumberRecordForm;
}

/**
 * ההגבלות שהיתר יכול לחול עליהן (ספק 04 form §3.2, §4.4). כשהרשימה פתוחה לבחירה היא תופסת את הטופס,
 * ובלוקים 1–3 מוסתרים עד שבוחרים.
 */
export default function RestrictionPicker({ form }: RestrictionPickerProps) {
  const { lookup, selectedRestriction, isPickerOpen, errors } = form.state;
  const hintId = useId();
  const view = useMemo(
    () => buildRestrictionPickerView(lookup.results, selectedRestriction, isPickerOpen),
    [lookup.results, selectedRestriction, isPickerOpen],
  );

  return (
    // tabIndex -1: הטופס מעביר לכאן פוקוס כשלא נבחרה הגבלה
    <div
      id={NUMBER_RECORD_FIELD_IDS.restriction}
      tabIndex={-1}
      className="mt-4 outline-none motion-safe:animate-fade-in"
    >
      <div className="flex min-h-11 items-center justify-between gap-2">
        <h3 id={RESTRICTION_PICKER_HEADING_ID} tabIndex={-1} className="text-sm text-text-primary outline-none">
          {view.title}
        </h3>
        {view.headerAction === "change" && (
          <IpsButton variant="text" size="small" onClick={form.openPicker}>
            {TEXTS.change}
          </IpsButton>
        )}
        {view.headerAction === "cancelChange" && (
          <IpsButton variant="text" size="small" onClick={form.closePicker}>
            {TEXTS.cancelChange}
          </IpsButton>
        )}
      </div>
      {view.hint && (
        <p id={hintId} className="text-xs text-text-muted">
          {view.hint}
        </p>
      )}

      <RestrictionOptionsList
        restrictions={view.visibleRestrictions}
        selectedRestrictionId={selectedRestriction?.restrictionId ?? null}
        isChoosing={view.isChoosing}
        hintId={view.hint ? hintId : undefined}
        onChoose={form.choose}
      />
      <ErrorText message={errors.restriction} />
    </div>
  );
}

interface RestrictionOptionsListProps {
  restrictions: SourceRestrictionSummaryDto[];
  selectedRestrictionId: number | null;
  isChoosing: boolean;
  hintId?: string;
  onChoose: (restriction: SourceRestrictionSummaryDto) => void;
}

// טעינה הדרגתית, כמו בשאר הרשימות: 30 כרטיסים, ועוד 30 בכל הגעה לסוף
function RestrictionOptionsList({
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
