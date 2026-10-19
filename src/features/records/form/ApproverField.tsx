import { useId, useState } from "react";
import { IpsButton } from "ui-library";
import ApproverPicker from "@/integrations/approver-mfe/ApproverPicker";
import type { ApproverRef } from "@/schemas/common.schema";
import ErrorText from "@/shared/components/form/ErrorText";
import FieldLabelText from "@/shared/components/form/FieldLabelText";
import { FORM_TEXTS } from "./formTexts";

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
 */
export default function ApproverField({ id, value, onChange, error }: ApproverFieldProps) {
  const labelId = useId();
  const [isChanging, setIsChanging] = useState(false);
  const isPickerShown = value === null || isChanging;

  const handleSelect = (approver: ApproverRef) => {
    onChange(approver);
    setIsChanging(false);
  };

  return (
    // tabIndex -1: הטופס מעביר לכאן פוקוס כשחסר גורם מאשר
    <div id={id} tabIndex={-1} role="group" aria-labelledby={labelId} className="outline-none">
      <FieldLabelText id={labelId} text={TEXTS.approverLabel} isRequired />

      {isPickerShown ? (
        <>
          <ApproverPicker onSelect={handleSelect} />
          {value !== null && (
            <IpsButton variant="text" size="small" onClick={() => setIsChanging(false)}>
              {TEXTS.cancelApproverChange}
            </IpsButton>
          )}
        </>
      ) : (
        <SelectedApprover approver={value} onChangeClick={() => setIsChanging(true)} />
      )}

      <ErrorText message={error} />
    </div>
  );
}

interface SelectedApproverProps {
  approver: ApproverRef;
  onChangeClick: () => void;
}

function SelectedApprover({ approver, onChangeClick }: SelectedApproverProps) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-input border border-grey-300 bg-paper py-2 ps-3 pe-1">
      <div className="min-w-0">
        <p className="truncate text-base text-text-primary">{approver.fullName}</p>
        {approver.roleTitle && <p className="truncate text-sm text-text-muted">{approver.roleTitle}</p>}
      </div>
      <IpsButton variant="text" onClick={onChangeClick}>
        {TEXTS.changeApprover}
      </IpsButton>
    </div>
  );
}
