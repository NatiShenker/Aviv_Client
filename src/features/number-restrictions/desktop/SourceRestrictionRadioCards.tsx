import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent } from "react";
import { IpsRadioGroup, type IpsRadioGroupOption, type IpsRadioGroupValue } from "ui-library";
import type { SourceRestrictionSummaryDto } from "@/types/phone-exceptions.schema";
import { formatDateRange } from "@/utils/dates";
import { ENTER_KEY } from "@/utils/dom";
import { RESTRICTION_PICKER_HEADING_ID } from "../form/numberRecordFormLogic";
import type { SourceRestrictionOptionsListProps } from "../form/source-restriction/SourceRestrictionPicker";
import { formatExistingPermitsSummary } from "../form/source-restriction/sourceRestrictionPickerLogic";
import { buildRestrictionReasonText, buildScopeLabel } from "../numberRestrictionsLogic";
import { NUMBER_RESTRICTIONS_TEXTS } from "../numberRestrictionsTexts";


const TAB_KEY = "Tab";

/**
 * ההגבלות לבחירה בדסקטופ (החלטת שלב 2): כרטיסי רדיו - כל הכרטיס לחיץ, והבחירה מכווצת את הרשימה לכרטיס שנבחר.
 * בעכבר לחיצה בוחרת מיד, ולחיצה על הכרטיס שכבר נבחר סוגרת את הבחירה, כמו "ביטול".
 * במקלדת החצים רק מסמנים כרטיס, כדי שאפשר יהיה לעבור על כולם בלי שהרשימה תתכווץ; הבחירה ננעלת ב-Enter,
 * או ב-Tab קדימה (כמו המשך מילוי הטופס). יציאה אחרת (למשל Shift+Tab חזרה לשדה המספר) לא בוחרת בטעות -
 * הסימון חוזר לבחירה הקיימת (הוחלט 2026-10-21). הרשימות קצרות, ולכן בלי טעינה הדרגתית
 */
export default function SourceRestrictionRadioCards({
  restrictions,
  selectedRestrictionId,
  isChoosing,
  hintId,
  onChoose,
  onKeepCurrentChoice,
}: SourceRestrictionOptionsListProps) {
  const [markedRestrictionId, setMarkedRestrictionId] = useState(selectedRestrictionId);
  // הלחיצה האחרונה הייתה בעכבר (ולא במקלדת) - אז הבחירה ננעלת מיד
  const isPointerChoiceRef = useRef(false);
  // המקש האחרון היה Tab קדימה - אז יציאה מהרשימה נועלת את הכרטיס המסומן
  const isTabForwardRef = useRef(false);

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
    isTabForwardRef.current = event.key === TAB_KEY && !event.shiftKey;
    // Enter בתוך טופס היה שולח אותו; כאן הוא נועל את הכרטיס המסומן
    if (event.key === ENTER_KEY) {
      event.preventDefault();
      chooseRestriction(markedRestrictionId, true);
    }
  };

  // לחיצה על הכרטיס שכבר נבחר לא משנה את הבחירה, ולכן גם לא מפעילה את onChange - כאן היא סוגרת את הבחירה.
  // onClick רץ לפני onChange, ולכן לחיצה על כרטיס אחר עדיין מגיעה ל-handleChange
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    const isRadio = target instanceof HTMLInputElement && target.type === "radio";
    if (!isChoosing || !isPointerChoiceRef.current || !isRadio) return;
    if (Number(target.value) === selectedRestrictionId) {
      isPointerChoiceRef.current = false;
      onKeepCurrentChoice();
    }
  };

  // הפוקוס יצא מהרשימה: ב-Tab קדימה הבחירה ננעלת והפוקוס ממשיך; בכל יציאה אחרת הסימון חוזר לבחירה הקיימת
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    if (isTabForwardRef.current) {
      chooseRestriction(markedRestrictionId, false);
    } else {
      setMarkedRestrictionId(selectedRestrictionId);
    }
    isTabForwardRef.current = false;
  };

  return (
    <div
      className="mt-2"
      onPointerDown={() => {
        isPointerChoiceRef.current = true;
        isTabForwardRef.current = false;
      }}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
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
