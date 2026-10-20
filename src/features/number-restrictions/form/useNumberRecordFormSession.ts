import { useInstituteDevices, useReasons } from "@/features/records/form/formReferenceData";
import { editedRecordOf, resolveFormStartingPoint, type RecordFormTarget } from "@/features/records/form/formStartingPoint";
import type { RecordFormSession } from "@/features/records/form/recordFormSession";
import { useInstitutes } from "@/store/institutesContext";
import type { WingDto } from "@/types/organization.schema";
import type { TraineePhoneRecordDto } from "@/types/phone-exceptions.schema";
import type { NumberRecordRef } from "../numberRestrictionsLogic";
import { NUMBER_RESTRICTIONS_TEXTS } from "../numberRestrictionsTexts";
import { NUMBER_RECORD_FORM_ID, type NumberRecordFormProps } from "./NumberRecordForm";
import { buildFormTitle } from "./numberRecordFormLogic";
import { useNumberRecordForm } from "./useNumberRecordForm";

// הפניה קבועה, כדי שרשימה ריקה לא תיחשב "רשימה חדשה" בכל רינדור
const NO_WINGS: WingDto[] = [];

/** הטופס שנפתח מעל ההיסטוריה. בעריכה (או ביצירה על בסיס רשומה) - סוג הרשומה והמזהה שלה */
export type NumberRecordFormTarget = RecordFormTarget<NumberRecordRef>;

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

/** רשימת ההגבלות לבחירה (בהיתר) לא כאן - כל פריסה מציגה אותה בדרך שלה */
export type NumberRecordFormSession = RecordFormSession<Omit<NumberRecordFormProps, "SourceRestrictionOptionsList">>;

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
