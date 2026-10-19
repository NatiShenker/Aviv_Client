import { useInstitutes } from "@/features/institutes/InstitutesProvider";
import type { FormSaveProps } from "@/features/records/form/FormFooter";
import { editedRecordOf, resolveFormStartingPoint } from "@/features/records/form/formStartingPoint";
import { useInstituteDevices } from "@/features/records/form/useInstituteDevices";
import { useReasons } from "@/features/records/form/useReasons";
import type { WingDto } from "@/schemas/organization.schema";
import type { TraineePhoneRecordDto } from "@/schemas/phone-exceptions.schema";
import { NUMBER_RESTRICTIONS_TEXTS } from "../numberRestrictionsTexts";
import { NUMBER_RECORD_FORM_ID, type NumberRecordFormProps } from "./NumberRecordForm";
import { buildFormTitle } from "./numberRecordFormLogic";
import { useNumberRecordForm } from "./useNumberRecordForm";
import type { NumberRecordFormTarget } from "./useNumberRecordFormRoute";

// הפניה קבועה, כדי שרשימה ריקה לא תיחשב "רשימה חדשה" בכל רינדור
const NO_WINGS: WingDto[] = [];

interface NumberRecordFormSessionOptions {
  /** הטופס שנפתח. null = הטופס סגור */
  target: NumberRecordFormTarget | null;
  traineeId: number;
  /** בעריכה: הרשומה מתוך ההיסטוריה שנטענה (הטופס נפתח לעריכה רק כשהיא קיימת ופעילה) */
  editRecord: TraineePhoneRecordDto | null;
  /** ביצירה על בסיס רשומה שהסתיימה: הרשומה שהערכים נלקחים ממנה */
  basedOnRecord: TraineePhoneRecordDto | null;
  onSaved: (savedRecordKey: string) => void;
}

/**
 * מה שפתיחה אחת של טופס ההגבלה / ההיתר צריכה, בלי המעטפת: כותרת, גוף הטופס, ומצב השמירה לפוטר.
 * רשימת ההגבלות לבחירה (בהיתר) לא כאן - כל פריסה מציגה אותה בדרך שלה
 */
export interface NumberRecordFormSession {
  title: string;
  formProps: Omit<NumberRecordFormProps, "RestrictionOptionsList">;
  saveProps: FormSaveProps;
  /** המשתמש שינה ערך מאז שהטופס נפתח */
  hasUserChanges: boolean;
}

/**
 * פתיחה אחת של טופס ההגבלה / ההיתר, לשתי הפריסות: נתוני העזר (מכשירים, סיבות), נקודת ההתחלה והטופס עצמו.
 * הערכים נקבעים כשהטופס נפתח. אחרי שמירה ההיסטוריה נטענת מחדש, והטופס נשאר כפי שהיה עד שנסגר
 */
export function useNumberRecordFormSession({
  target,
  traineeId,
  editRecord,
  basedOnRecord,
  onSaved,
}: NumberRecordFormSessionOptions): NumberRecordFormSession {
  const { selectedInstitute } = useInstitutes();
  const instituteId = selectedInstitute?.id ?? null;
  const devices = useInstituteDevices(instituteId);
  const reasons = useReasons("phoneException");

  const startingPoint = resolveFormStartingPoint(target, editRecord, basedOnRecord);
  const form = useNumberRecordForm({ traineeId, instituteId, startingPoint, reasons, onSaved });

  return {
    title: buildFormTitle(form.state),
    formProps: {
      form,
      editRecord: editedRecordOf(startingPoint),
      devices,
      wings: selectedInstitute?.wings ?? NO_WINGS,
      reasons,
    },
    saveProps: {
      formId: NUMBER_RECORD_FORM_ID,
      saveLabel: NUMBER_RESTRICTIONS_TEXTS.form.save,
      saveError: form.saveError,
      isBusy: form.isSaving || form.isFileUploading,
    },
    hasUserChanges: form.hasUserChanges,
  };
}
