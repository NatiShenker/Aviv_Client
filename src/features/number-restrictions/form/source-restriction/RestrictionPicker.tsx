import { useId, useMemo, type ComponentType } from "react";
import { IpsButton } from "ui-library";
import ErrorText from "@/shared/components/form/ErrorText";
import type { SourceRestrictionSummaryDto } from "@/types/phone-exceptions.schema";
import { NUMBER_RESTRICTIONS_TEXTS } from "../../numberRestrictionsTexts";
import { NUMBER_RECORD_FIELD_IDS, RESTRICTION_PICKER_HEADING_ID } from "../numberRecordFormLogic";
import type { ChooseRestrictionOptions, NumberRecordFormController } from "../useNumberRecordForm";
import { buildRestrictionPickerView } from "./restrictionPickerLogic";

const TEXTS = NUMBER_RESTRICTIONS_TEXTS.form.picker;

/** רשימת ההגבלות לבחירה. כל פריסה מציגה אותה בדרך שלה; הכותרת, הרמז והמצבים משותפים */
export interface RestrictionOptionsListProps {
  /** הכרטיסים שמוצגים עכשיו: כולם בזמן בחירה, או רק הנבחר */
  restrictions: SourceRestrictionSummaryDto[];
  selectedRestrictionId: number | null;
  /** בזמן בחירה אפשר לבחור הגבלה; אחרת מוצג רק הכרטיס שנבחר */
  isChoosing: boolean;
  /** מזהה הרמז שמעל הרשימה, כשהוא מוצג - מתאר את הרשימה לקורא מסך */
  hintId?: string;
  /** בלי options - הפוקוס עובר לכותרת הבוחר אחרי הבחירה */
  onChoose: (restriction: SourceRestrictionSummaryDto, options?: ChooseRestrictionOptions) => void;
}

export type RestrictionOptionsListComponent = ComponentType<RestrictionOptionsListProps>;

interface RestrictionPickerProps {
  form: NumberRecordFormController;
  RestrictionOptionsList: RestrictionOptionsListComponent;
}

/**
 * ההגבלות שהיתר יכול לחול עליהן (ספק 04 form §3.2, §4.4). כשהרשימה פתוחה לבחירה היא תופסת את הטופס,
 * ובלוקים 1–3 מוסתרים עד שבוחרים.
 */
export default function RestrictionPicker({ form, RestrictionOptionsList }: RestrictionPickerProps) {
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
