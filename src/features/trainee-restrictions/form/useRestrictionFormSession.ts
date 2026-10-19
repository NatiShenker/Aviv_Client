import { useInstitutes } from "@/features/institutes/InstitutesProvider";
import type { FormSaveProps } from "@/features/records/form/FormFooter";
import { resolveFormStartingPoint } from "@/features/records/form/formStartingPoint";
import { useInstituteDevices } from "@/features/records/form/useInstituteDevices";
import { useReasons } from "@/features/records/form/useReasons";
import type { WingDto } from "@/schemas/organization.schema";
import type { TraineeRestrictionRecordDto } from "@/schemas/trainee-restrictions.schema";
import { TRAINEE_RESTRICTIONS_TEXTS } from "../traineeRestrictionsTexts";
import { RESTRICTION_FORM_ID, type RestrictionFormProps } from "./RestrictionForm";
import { useRestrictionForm } from "./useRestrictionForm";
import type { RestrictionFormTarget } from "./useRestrictionFormRoute";

const TEXTS = TRAINEE_RESTRICTIONS_TEXTS.form;
// הפניה קבועה, כדי שרשימה ריקה לא תיחשב "רשימה חדשה" בכל רינדור
const NO_WINGS: WingDto[] = [];

interface RestrictionFormSessionOptions {
  /** הטופס שנפתח. null = הטופס סגור */
  target: RestrictionFormTarget | null;
  traineeId: number;
  /** בעריכה: הרשומה מתוך ההיסטוריה שנטענה (הטופס נפתח לעריכה רק כשהיא קיימת ופעילה) */
  editRecord: TraineeRestrictionRecordDto | null;
  /** ביצירה על בסיס רשומה שהסתיימה: הרשומה שהערכים נלקחים ממנה */
  basedOnRecord: TraineeRestrictionRecordDto | null;
  onSaved: (savedRecordId: number) => void;
}

/** מה שפתיחה אחת של טופס ההגבלה צריכה, בלי המעטפת: כותרת, גוף הטופס, ומצב השמירה לפוטר */
export interface RestrictionFormSession {
  title: string;
  formProps: RestrictionFormProps;
  saveProps: FormSaveProps;
  /** המשתמש שינה ערך מאז שהטופס נפתח */
  hasUserChanges: boolean;
}

/**
 * פתיחה אחת של טופס ההגבלה, לשתי הפריסות: נתוני העזר (מכשירים, סיבות), נקודת ההתחלה והטופס עצמו.
 * הערכים נקבעים כשהטופס נפתח. אחרי שמירה ההיסטוריה נטענת מחדש, והטופס נשאר כפי שהיה עד שנסגר
 */
export function useRestrictionFormSession({
  target,
  traineeId,
  editRecord,
  basedOnRecord,
  onSaved,
}: RestrictionFormSessionOptions): RestrictionFormSession {
  const { selectedInstitute } = useInstitutes();
  const devices = useInstituteDevices(selectedInstitute?.id ?? null);
  const reasons = useReasons("traineeRestriction");

  const startingPoint = resolveFormStartingPoint(target, editRecord, basedOnRecord);
  const form = useRestrictionForm({ traineeId, startingPoint, reasons, onSaved });

  return {
    title: target?.mode === "edit" ? TEXTS.editTitle : TEXTS.createTitle,
    formProps: { form, devices, wings: selectedInstitute?.wings ?? NO_WINGS, reasons },
    saveProps: {
      formId: RESTRICTION_FORM_ID,
      saveLabel: TEXTS.save,
      saveError: form.saveError,
      isBusy: form.isSaving || form.isFileUploading,
    },
    hasUserChanges: form.hasUserChanges,
  };
}
