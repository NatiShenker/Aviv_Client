import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { IpsRadioGroup, type IpsRadioGroupOption, type IpsRadioGroupValue } from "ui-library";
import type { SourceRestrictionSummaryDto } from "@/types/phone-exceptions.schema";
import { formatDateRange } from "@/utils/dates";
import { ENTER_KEY } from "@/utils/dom";
import { RESTRICTION_PICKER_HEADING_ID } from "../form/numberRecordFormLogic";
import type { SourceRestrictionOptionsListProps } from "../form/source-restriction/SourceRestrictionPicker";
import { formatExistingPermitsSummary } from "../form/source-restriction/sourceRestrictionPickerLogic";
import { buildRestrictionReasonText, buildScopeLabel } from "../numberRestrictionsLogic";
import { NUMBER_RESTRICTIONS_TEXTS } from "../numberRestrictionsTexts";


/**
 * ההגבלות לבחירה בדסקטופ (החלטת שלב 2): כרטיסי רדיו - כל הכרטיס לחיץ, והבחירה מכווצת את הרשימה לכרטיס שנבחר.
 * בעכבר לחיצה בוחרת מיד. במקלדת החצים רק מסמנים כרטיס, כדי שאפשר יהיה לעבור על כולם בלי שהרשימה תתכווץ;
 * הבחירה ננעלת ב-Enter, או כשהפוקוס יוצא מהרשימה. הרשימות קצרות, ולכן בלי טעינה הדרגתית
 */
export default function SourceRestrictionRadioCards({
  restrictions,
  selectedRestrictionId,
  isChoosing,
  hintId,
  onChoose,
}: SourceRestrictionOptionsListProps) {
  const [markedRestrictionId, setMarkedRestrictionId] = useState(selectedRestrictionId);
  // הלחיצה האחרונה הייתה בעכבר (ולא במקלדת) - אז הבחירה ננעלת מיד
  const isPointerChoiceRef = useRef(false);

  // בכל פתיחה לבחירה (גם אחרי "החלפה") הסימון מתחיל מההגבלה שכבר נבחרה
  useEffect(() => {
    setMarkedRestrictionId(selectedRestrictionId);
  }, [isChoosing, selectedRestrictionId]);

  const chooseRestriction = (restrictionId: number | null, shouldFocusPicker: boolean) => {
    const restriction = restrictions.find((item) => item.restrictionId === restrictionId);
    if (restriction && restrictionId !== selectedRestrictionId) {
      onChoose(restriction, { shouldFocusPicker });
    }
  };

  const handleChange = (value: IpsRadioGroupValue) => {
    const restrictionId = Number(value);
    setMarkedRestrictionId(restrictionId);
    if (isPointerChoiceRef.current) {
      isPointerChoiceRef.current = false;
      chooseRestriction(restrictionId, true);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    isPointerChoiceRef.current = false;
    // Enter בתוך טופס היה שולח אותו; כאן הוא נועל את הכרטיס המסומן
    if (event.key === ENTER_KEY) {
      event.preventDefault();
      chooseRestriction(markedRestrictionId, true);
    }
  };

  // הפוקוס יצא מהרשימה - הבחירה ננעלת, והפוקוס נשאר איפה שהמשתמש העביר אותו
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    chooseRestriction(markedRestrictionId, false);
  };

  return (
    <div
      className="mt-2"
      onPointerDown={() => {
        isPointerChoiceRef.current = true;
      }}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    >
      <IpsRadioGroup
        variant="cards"
        aria-labelledby={RESTRICTION_PICKER_HEADING_ID}
        aria-describedby={hintId}
        options={restrictions.map(toRestrictionCardOption)}
        value={markedRestrictionId}
        onChange={handleChange}
      />
    </div>
  );
}

// כרטיס: ההיקף ככותרת, ומתחתיו התאריכים והסיבה, וההיתרים הקיימים לחניך כשיש (ספק 04 form §3.2.1)
function toRestrictionCardOption(restriction: SourceRestrictionSummaryDto): IpsRadioGroupOption {
  return {
    value: restriction.restrictionId,
    label: buildScopeLabel(restriction),
    description: <RestrictionCardDetails restriction={restriction} />,
  };
}

function RestrictionCardDetails({ restriction }: { restriction: SourceRestrictionSummaryDto }) {
  const hasExistingPermits = restriction.existingTraineePermits.length > 0;

  return (
    <>
      <span className="block">
        <span dir="ltr">{formatDateRange(restriction.startDate, restriction.endDate)}</span>
        {NUMBER_RESTRICTIONS_TEXTS.values.partsSeparator}
        {buildRestrictionReasonText(restriction)}
      </span>
      {/* מידע בלבד - לא מונע היתר נוסף (OQ-12) */}
      {hasExistingPermits && (
        <span className="mt-1 block text-text-primary">
          {NUMBER_RESTRICTIONS_TEXTS.form.picker.existingPermits(
            formatExistingPermitsSummary(restriction.existingTraineePermits),
          )}
        </span>
      )}
    </>
  );
}
