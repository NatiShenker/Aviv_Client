import { useInstituteDevices, useReasons } from "@/features/records/form/formReferenceData";
import { resolveFormStartingPoint, type RecordFormTarget } from "@/features/records/form/formStartingPoint";
import type { RecordFormSession } from "@/features/records/form/recordFormSession";
import { useInstitutes } from "@/store/institutesContext";
import type { WingDto } from "@/types/organization.schema";
import type { TraineeRestrictionRecordDto } from "@/types/trainee-restrictions.schema";
import { TRAINEE_RESTRICTIONS_TEXTS } from "../traineeRestrictionsTexts";
import { TRAINEE_RESTRICTION_FORM_ID, type TraineeRestrictionFormProps } from "./TraineeRestrictionForm";
import { useTraineeRestrictionForm } from "./useTraineeRestrictionForm";

const TEXTS = TRAINEE_RESTRICTIONS_TEXTS.form;
// הפניה קבועה, כדי שרשימה ריקה לא תיחשב "רשימה חדשה" בכל רינדור
const NO_WINGS: WingDto[] = [];

/** הטופס שנפתח מעל ההיסטוריה. בעריכה (או ביצירה על בסיס רשומה) - מזהה ההגבלה */
export type TraineeRestrictionFormTarget = RecordFormTarget<number>;

interface TraineeRestrictionFormSessionOptions {
  /** הטופס שנפתח. null = הטופס סגור */
  target: TraineeRestrictionFormTarget | null;
  traineeId: number;
  /** בעריכה: הרשומה מתוך ההיסטוריה שנטענה (הטופס נפתח לעריכה רק כשהיא קיימת ופעילה) */
  editRecord: TraineeRestrictionRecordDto | null;
  /** ביצירה על בסיס רשומה שהסתיימה: הרשומה שהערכים נלקחים ממנה */
  basedOnRecord: TraineeRestrictionRecordDto | null;
  onSaved: (savedRecordId: number) => void;
}

export type TraineeRestrictionFormSession = RecordFormSession<TraineeRestrictionFormProps>;

/**
 * פתיחה אחת של טופס ההגבלה, לשתי הפריסות: נתוני העזר (מכשירים, סיבות), נקודת ההתחלה והטופס עצמו.
 * הערכים נקבעים כשהטופס נפתח. אחרי שמירה ההיסטוריה נטענת מחדש, והטופס נשאר כפי שהיה עד שנסגר
 */
export function useTraineeRestrictionFormSession({
  target,
  traineeId,
  editRecord,
  basedOnRecord,
  onSaved,
}: TraineeRestrictionFormSessionOptions): TraineeRestrictionFormSession {
  const { selectedInstitute } = useInstitutes();
  const devices = useInstituteDevices(selectedInstitute?.id ?? null);
  const reasons = useReasons("traineeRestriction");

  const startingPoint = resolveFormStartingPoint(target, editRecord, basedOnRecord);
  const form = useTraineeRestrictionForm({ traineeId, startingPoint, reasons, onSaved });

  return {
    title: target?.mode === "edit" ? TEXTS.editTitle : TEXTS.createTitle,
    formProps: { form, devices, wings: selectedInstitute?.wings ?? NO_WINGS, reasons },
    saveProps: {
      formId: TRAINEE_RESTRICTION_FORM_ID,
      saveLabel: TEXTS.save,
      saveError: form.saveError,
      isBusy: form.isSaving || form.isFileUploading,
    },
    hasUserChanges: form.hasUserChanges,
  };
}
