import { useId, useMemo, type ComponentType } from "react";
import { IpsButton } from "ui-library";
import ErrorText from "@/shared/components/form/ErrorText";
import SectionHeading, { useSubsectionHeadingLevel } from "@/shared/components/SectionHeading";
import { EXPANDED_TOUCH_TARGET_SX } from "@/shared/components/touchTarget";
import { focusInPlace } from "@/utils/dom";
import type { SourceRestrictionSummaryDto } from "@/types/phone-exceptions.schema";
import { NUMBER_RESTRICTIONS_TEXTS } from "../../numberRestrictionsTexts";
import { NUMBER_RECORD_FIELD_IDS, RESTRICTION_PICKER_HEADING_ID } from "../numberRecordFormLogic";
import type { ChooseRestrictionOptions, NumberRecordFormController } from "../useNumberRecordForm";
import { buildSourceRestrictionPickerView } from "./sourceRestrictionPickerLogic";

const TEXTS = NUMBER_RESTRICTIONS_TEXTS.form.picker;

/** רשימת ההגבלות לבחירה. כל פריסה מציגה אותה בדרך שלה; הכותרת, הרמז והמצבים משותפים */
export interface SourceRestrictionOptionsListProps {
  /** הכרטיסים שמוצגים עכשיו: כולם בזמן בחירה, או רק הנבחר */
  restrictions: SourceRestrictionSummaryDto[];
  /** idntAvivRestrictionNumber של ההגבלה שנבחרה */
  selectedRestrictionId: number | null;
  /** בזמן בחירה אפשר לבחור הגבלה; אחרת מוצג רק הכרטיס שנבחר */
  isChoosing: boolean;
  /** מזהה הרמז שמעל הרשימה, כשהוא מוצג - מתאר את הרשימה לקורא מסך */
  hintId?: string;
  /** בלי options - הפוקוס עובר לכותרת הבוחר אחרי הבחירה */
  onChoose: (restriction: SourceRestrictionSummaryDto, options?: ChooseRestrictionOptions) => void;
  /** בחירה מחדש של ההגבלה שכבר נבחרה (אחרי "החלפה"): סוגרת את הבחירה, כמו "ביטול" */
  onKeepCurrentChoice: () => void;
}

export type SourceRestrictionOptionsListComponent = ComponentType<SourceRestrictionOptionsListProps>;

interface SourceRestrictionPickerProps {
  form: NumberRecordFormController;
  SourceRestrictionOptionsList: SourceRestrictionOptionsListComponent;
}

/**
 * ההגבלות שהיתר יכול לחול עליהן (ספק 04 form §3.2, §4.4). כשהרשימה פתוחה לבחירה היא תופסת את הטופס,
 * ובלוקים 1–3 מוסתרים עד שבוחרים.
 */
export default function SourceRestrictionPicker({ form, SourceRestrictionOptionsList }: SourceRestrictionPickerProps) {
  const { lookup, selectedRestriction, isPickerOpen, errors } = form.state;
  const hintId = useId();
  const changeButtonId = useId();
  // הבוחר יושב בתוך בלוק בטופס, ולכן הכותרת שלו רמה אחת מתחת לבלוק
  const headingLevel = useSubsectionHeadingLevel();
  const view = useMemo(
    () => buildSourceRestrictionPickerView(lookup.results, selectedRestriction, isPickerOpen),
    [lookup.results, selectedRestriction, isPickerOpen],
  );

  // "החלפה" ו"ביטול" מחליפים זה את זה, ולכן הפוקוס עובר יזום: לכותרת הבוחר כשהרשימה נפתחת,
  // ובחזרה ל"החלפה" כשהיא נסגרת בלי בחירה חדשה
  const openPicker = () => {
    form.openPicker();
    focusInPlace(RESTRICTION_PICKER_HEADING_ID);
  };

  const keepCurrentChoice = () => {
    form.closePicker();
    focusInPlace(changeButtonId);
  };

  return (
    // tabIndex -1: הטופס מעביר לכאן פוקוס כשלא נבחרה הגבלה
    <div
      id={NUMBER_RECORD_FIELD_IDS.restriction}
      tabIndex={-1}
      className="mt-4 outline-none motion-safe:animate-fade-in"
    >
      <div className="flex min-h-11 items-center justify-between gap-2">
        <SectionHeading
          level={headingLevel}
          id={RESTRICTION_PICKER_HEADING_ID}
          tabIndex={-1}
          className="text-sm text-text-primary outline-none"
        >
          {view.title}
        </SectionHeading>
        {view.headerAction === "change" && (
          <IpsButton
            id={changeButtonId}
            variant="text"
            size="small"
            sx={EXPANDED_TOUCH_TARGET_SX}
            onClick={openPicker}
          >
            {TEXTS.change}
          </IpsButton>
        )}
        {view.headerAction === "cancelChange" && (
          <IpsButton variant="text" size="small" sx={EXPANDED_TOUCH_TARGET_SX} onClick={keepCurrentChoice}>
            {TEXTS.cancelChange}
          </IpsButton>
        )}
      </div>
      {view.hint && (
        <p id={hintId} className="text-xs text-text-muted">
          {view.hint}
        </p>
      )}

      <SourceRestrictionOptionsList
        restrictions={view.visibleRestrictions}
        selectedRestrictionId={selectedRestriction?.idntAvivRestrictionNumber ?? null}
        isChoosing={view.isChoosing}
        hintId={view.hint ? hintId : undefined}
        onChoose={form.choose}
        onKeepCurrentChoice={keepCurrentChoice}
      />
      <ErrorText message={errors.restriction} />
    </div>
  );
}
