import { IpsButton } from "ui-library";
import ErrorText from "@/shared/components/form/ErrorText";
import { FORM_TEXTS } from "./formTexts";

/** מצב כפתור השמירה, כפי שהטופס מחשב אותו */
export interface FormSaveProps {
  /** כפתור השמירה נמצא מחוץ ל-<form>, ומשויך אליו לפי המזהה */
  formId: string;
  saveLabel: string;
  saveError?: string;
  /** בזמן שמירה או העלאת קובץ - השמירה מחכה (ספק 03 form §7) */
  isBusy: boolean;
}

interface FormFooterProps extends FormSaveProps {
  /** "ביטול" - סגירה בלי שמירה */
  onCancel: () => void;
}

/**
 * פוטר טופס היצירה / העריכה: "ביטול" ו"שמור" בכל הטפסים (ספק 00 §3.26, OQ-17).
 * שגיאת שמירה כללית מוצגת מעל הכפתורים (ספק 03 form §7)
 */
export default function FormFooter({ formId, saveLabel, saveError, isBusy, onCancel }: FormFooterProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <ErrorText message={saveError} />
      <div className="grid grid-cols-2 gap-2">
        <IpsButton variant="outlined" size="large" fullWidth onClick={onCancel}>
          {FORM_TEXTS.footer.cancel}
        </IpsButton>
        <IpsButton type="submit" form={formId} variant="contained" size="large" fullWidth loading={isBusy}>
          {saveLabel}
        </IpsButton>
      </div>
    </div>
  );
}
