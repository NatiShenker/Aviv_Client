import { useId, useState } from "react";
import { IpsButton } from "ui-library";
import ApproverPicker from "@/integrations/approver-mfe/ApproverPicker";
import ErrorText from "@/shared/components/form/ErrorText";
import FieldLabelText from "@/shared/components/form/FieldLabelText";
import { EXPANDED_TOUCH_TARGET_SX } from "@/shared/components/touchTarget";
import type { ApproverRef } from "@/types/common.schema";
import { focusInPlace } from "@/utils/dom";
import { FORM_TEXTS } from "../formTexts";

const TEXTS = FORM_TEXTS.decision;

interface ApproverFieldProps {
  /** מזהה האזור, כדי שאפשר יהיה להעביר אליו פוקוס כשיש בו שגיאה */
  id: string;
  value: ApproverRef | null;
  onChange: (approver: ApproverRef) => void;
  error?: string;
}

/**
 * "גורם מאשר" (חובה): הבחירה נעשית ב-MFE החיצוני. אחרי הבחירה מוצגים פרטי הגורם עם "החלפה",
 * שפותחת את ה-MFE שוב; "ביטול" חוזר לגורם שכבר נבחר.
 * כל מעבר מחליף את מה שמוצג, ולכן הפוקוס עובר יזום למקום הבא - ולא נופל לתחילת הטופס
 */
export default function ApproverField({ id, value, onChange, error }: ApproverFieldProps) {
  const labelId = useId();
  const changeButtonId = useId();
  const [isChanging, setIsChanging] = useState(false);
  const isPickerShown = value === null || isChanging;

  // הגורם נבחר: חוזרים לכפתור "החלפה" שלו
  const handleSelect = (approver: ApproverRef) => {
    onChange(approver);
    setIsChanging(false);
    focusInPlace(changeButtonId);
  };

  // ה-MFE מוצג שוב: הפוקוס לאזור השדה, שקורא מסך משמיע את שמו, והמקלדת ממשיכה ממנו לחיפוש
  const startChange = () => {
    setIsChanging(true);
    focusInPlace(id);
  };

  const cancelChange = () => {
    setIsChanging(false);
    focusInPlace(changeButtonId);
  };

  return (
    // tabIndex -1: הטופס מעביר לכאן פוקוס כשחסר גורם מאשר
    <div id={id} tabIndex={-1} role="group" aria-labelledby={labelId} className="outline-none">
      <FieldLabelText id={labelId} text={TEXTS.approverLabel} isRequired />

      {isPickerShown ? (
        <>
          <ApproverPicker onSelect={handleSelect} />
          {/* בקצה (שמאל) - באותו צד כמו "החלפה" שפתחה את החיפוש, כמו בבוחר ההגבלה בהיתר (הוחלט 2026-10-21) */}
          {value !== null && (
            <div className="flex justify-end">
              <IpsButton variant="text" size="small" sx={EXPANDED_TOUCH_TARGET_SX} onClick={cancelChange}>
                {TEXTS.cancelApproverChange}
              </IpsButton>
            </div>
          )}
        </>
      ) : (
        <SelectedApprover approver={value} changeButtonId={changeButtonId} onChangeClick={startChange} />
      )}

      <ErrorText message={error} />
    </div>
  );
}

interface SelectedApproverProps {
  approver: ApproverRef;
  changeButtonId: string;
  onChangeClick: () => void;
}

function SelectedApprover({ approver, changeButtonId, onChangeClick }: SelectedApproverProps) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-input border border-grey-300 bg-paper py-2 ps-3 pe-1">
      <div className="min-w-0">
        {/* שם ותפקיד ארוכים נחתכים - המלאים בריחוף */}
        <p title={approver.fullName} className="truncate text-base text-text-primary">
          {approver.fullName}
        </p>
        {approver.roleTitle && (
          <p title={approver.roleTitle} className="truncate text-sm text-text-muted">
            {approver.roleTitle}
          </p>
        )}
      </div>
      <IpsButton id={changeButtonId} variant="text" sx={EXPANDED_TOUCH_TARGET_SX} onClick={onChangeClick}>
        {TEXTS.changeApprover}
      </IpsButton>
    </div>
  );
}
