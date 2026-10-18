import { IpsButton } from "ui-library";
import ErrorText from "./ErrorText";
import { FORM_TEXTS } from "./formTexts";

interface FormSheetFooterProps {
  /** כפתור השמירה נמצא מחוץ ל-<form>, ומשויך אליו לפי המזהה */
  formId: string;
  saveLabel: string;
  saveError?: string;
  /** בזמן שמירה או העלאת קובץ - השמירה מחכה (ספק 03 form §7) */
  isBusy: boolean;
  /** "ביטול" לצד השמירה (ספק 04 form §3.7). בלעדיו - כפתור שמירה אחד ברוחב מלא (ספק 03, OQ-17) */
  onCancel?: () => void;
}

/** פוטר טופס היצירה / העריכה. שגיאת שמירה כללית מוצגת מעל הכפתורים (ספק 03 form §7) */
export default function FormSheetFooter({ formId, saveLabel, saveError, isBusy, onCancel }: FormSheetFooterProps) {
  const saveButton = (
    <IpsButton type="submit" form={formId} variant="contained" size="large" fullWidth loading={isBusy}>
      {saveLabel}
    </IpsButton>
  );

  return (
    <div className="flex w-full flex-col gap-2">
      <ErrorText message={saveError} />
      {onCancel ? (
        <div className="grid grid-cols-2 gap-2">
          <IpsButton variant="outlined" size="large" fullWidth onClick={onCancel}>
            {FORM_TEXTS.footer.cancel}
          </IpsButton>
          {saveButton}
        </div>
      ) : (
        saveButton
      )}
    </div>
  );
}
