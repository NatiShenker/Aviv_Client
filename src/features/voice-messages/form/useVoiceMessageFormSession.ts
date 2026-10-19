import type { FormSaveProps } from "@/features/records/form/FormFooter";
import { editedRecordOf, resolveFormStartingPoint } from "@/features/records/form/formStartingPoint";
import { useReasons } from "@/features/records/form/useReasons";
import type { TraineeVoiceMessageRecordDto } from "@/schemas/voice-messages.schema";
import { VOICE_MESSAGES_TEXTS } from "../voiceMessagesTexts";
import { useVoiceMessageForm } from "./useVoiceMessageForm";
import type { VoiceMessageFormTarget } from "./useVoiceMessageFormRoute";
import { VOICE_MESSAGE_FORM_ID, type VoiceMessageFormProps } from "./VoiceMessageForm";

const TEXTS = VOICE_MESSAGES_TEXTS.form;

interface VoiceMessageFormSessionOptions {
  /** הטופס שנפתח. null = הטופס סגור */
  target: VoiceMessageFormTarget | null;
  traineeId: number;
  /** השם שמושמע בתוכן ההודעה */
  traineeFullName: string;
  /** בעריכה: ההודעה מתוך ההיסטוריה שנטענה (הטופס נפתח לעריכה רק כשהיא קיימת ופעילה) */
  editRecord: TraineeVoiceMessageRecordDto | null;
  /** ביצירה על בסיס הודעה שהסתיימה: ההודעה שהערכים נלקחים ממנה */
  basedOnRecord: TraineeVoiceMessageRecordDto | null;
  onSaved: (savedRecordId: number) => void;
}

/** מה שפתיחה אחת של טופס ההודעה צריכה, בלי המעטפת: כותרת, גוף הטופס, ומצב השמירה לפוטר */
export interface VoiceMessageFormSession {
  title: string;
  formProps: VoiceMessageFormProps;
  saveProps: FormSaveProps;
  /** המשתמש שינה ערך מאז שהטופס נפתח */
  hasUserChanges: boolean;
}

/**
 * פתיחה אחת של טופס ההודעה לנמען, לשתי הפריסות: רשימת הסיבות, נקודת ההתחלה והטופס עצמו.
 * הערכים נקבעים כשהטופס נפתח. אחרי שמירה ההיסטוריה נטענת מחדש, והטופס נשאר כפי שהיה עד שנסגר
 */
export function useVoiceMessageFormSession({
  target,
  traineeId,
  traineeFullName,
  editRecord,
  basedOnRecord,
  onSaved,
}: VoiceMessageFormSessionOptions): VoiceMessageFormSession {
  const reasons = useReasons("voiceMessage");

  const startingPoint = resolveFormStartingPoint(target, editRecord, basedOnRecord);
  const form = useVoiceMessageForm({ traineeId, startingPoint, reasons, onSaved });

  return {
    title: target?.mode === "edit" ? TEXTS.editTitle : TEXTS.createTitle,
    formProps: { form, editRecord: editedRecordOf(startingPoint), traineeFullName, reasons },
    saveProps: {
      formId: VOICE_MESSAGE_FORM_ID,
      saveLabel: TEXTS.save,
      saveError: form.saveError,
      isBusy: form.isSaving || form.isFileUploading,
    },
    hasUserChanges: form.hasUserChanges,
  };
}
