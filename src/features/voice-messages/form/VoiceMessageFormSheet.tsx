import FormSheetFooter from "@/features/records/form/FormSheetFooter";
import { editedRecordOf, resolveFormStartingPoint } from "@/features/records/form/formStartingPoint";
import { useFormSheetSession } from "@/features/records/form/useFormSheetSession";
import { useReasons } from "@/features/records/form/useReasons";
import type { TraineeVoiceMessageRecordDto } from "@/schemas/voice-messages.schema";
import FormSheet from "@/shells/mobile/FormSheet";
import { VOICE_MESSAGES_TEXTS } from "../voiceMessagesTexts";
import { useVoiceMessageForm } from "./useVoiceMessageForm";
import type { VoiceMessageFormTarget } from "./useVoiceMessageFormRoute";
import VoiceMessageForm, { VOICE_MESSAGE_FORM_ID } from "./VoiceMessageForm";

const TEXTS = VOICE_MESSAGES_TEXTS.form;

interface VoiceMessageFormSheetProps {
  /** הטופס שהכתובת מבקשת. null = הטופס סגור */
  target: VoiceMessageFormTarget | null;
  traineeId: number;
  traineeFullName: string;
  /** בעריכה: ההודעה מתוך ההיסטוריה שנטענה (הטופס נפתח לעריכה רק כשהיא קיימת ופעילה) */
  editRecord: TraineeVoiceMessageRecordDto | null;
  /** ביצירה על בסיס הודעה שהסתיימה: ההודעה שהערכים נלקחים ממנה */
  basedOnRecord: TraineeVoiceMessageRecordDto | null;
  onClose: () => void;
  onSaved: (savedRecordId: number) => void;
}

/**
 * טופס ההודעה לנמען במסך מלא מעל ההיסטוריה. נפתח ונסגר לפי הכתובת, ולכן גם "חזרה" בדפדפן סוגרת אותו.
 * כל פתיחה מתחילה טופס נקי; בסגירה התוכן נשאר עד סוף האנימציה.
 */
export default function VoiceMessageFormSheet({ target, ...dialogProps }: VoiceMessageFormSheetProps) {
  const session = useFormSheetSession(target);

  return <VoiceMessageFormDialog key={session.key} isOpen={target !== null} target={session.target} {...dialogProps} />;
}

interface VoiceMessageFormDialogProps extends Omit<VoiceMessageFormSheetProps, "target"> {
  isOpen: boolean;
  target: VoiceMessageFormTarget | null;
}

function VoiceMessageFormDialog({
  isOpen,
  target,
  traineeId,
  traineeFullName,
  editRecord,
  basedOnRecord,
  onClose,
  onSaved,
}: VoiceMessageFormDialogProps) {
  const reasons = useReasons("voiceMessage");

  const isEditMode = target?.mode === "edit";
  // הערכים נקבעים כשהטופס נפתח. אחרי שמירה ההיסטוריה נטענת מחדש, והטופס נשאר כפי שהיה עד שנסגר
  const startingPoint = resolveFormStartingPoint(target, editRecord, basedOnRecord);
  const form = useVoiceMessageForm({ traineeId, startingPoint, reasons, onSaved });

  return (
    <FormSheet
      open={isOpen}
      title={isEditMode ? TEXTS.editTitle : TEXTS.createTitle}
      onClose={onClose}
      actions={
        <FormSheetFooter
          formId={VOICE_MESSAGE_FORM_ID}
          saveLabel={TEXTS.save}
          saveError={form.saveError}
          isBusy={form.isSaving || form.isFileUploading}
          onCancel={onClose}
        />
      }
    >
      <VoiceMessageForm
        form={form}
        editRecord={editedRecordOf(startingPoint)}
        traineeFullName={traineeFullName}
        reasons={reasons}
      />
    </FormSheet>
  );
}
