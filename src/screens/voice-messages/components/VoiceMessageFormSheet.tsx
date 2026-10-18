import type { TraineeVoiceMessageRecordDto } from "@/schemas/voice-messages.schema";
import { getCachedVoiceMessageReasons, getVoiceMessageReasons } from "@/services/reasonsService";
import FormSheet from "@/shared/components/FormSheet";
import FormSheetFooter from "@/shared/components/form/FormSheetFooter";
import { useAsyncResource } from "@/shared/hooks/useAsyncResource";
import { useFormSheetSession } from "@/shared/hooks/useFormSheetSession";
import { editedRecordOf, resolveFormStartingPoint } from "@/shared/navigation/formStartingPoint";
import type { VoiceMessageFormTarget } from "../useVoiceMessageFormRoute";
import { useVoiceMessageForm } from "../useVoiceMessageForm";
import { VOICE_MESSAGES_TEXTS } from "../voiceMessagesTexts";
import VoiceMessageForm, { VOICE_MESSAGE_FORM_ID } from "./VoiceMessageForm";

const TEXTS = VOICE_MESSAGES_TEXTS.form;
const REASONS_REQUEST_KEY = "voiceMessageReasons";

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
  // הסיבות נשמרות אחרי הטעינה הראשונה
  const reasons = useAsyncResource({
    requestKey: REASONS_REQUEST_KEY,
    load: getVoiceMessageReasons,
    readCache: getCachedVoiceMessageReasons,
  });

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
