import FormFooter from "@/features/records/form/FormFooter";
import FormSheet from "@/shells/mobile/FormSheet";
import { useFormSheetSession } from "@/shells/mobile/useFormSheetSession";
import type { TraineeVoiceMessageRecordDto } from "@/types/voice-messages.schema";
import { useVoiceMessageFormSession, type VoiceMessageFormTarget } from "../form/useVoiceMessageFormSession";
import VoiceMessageForm from "../form/VoiceMessageForm";

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

function VoiceMessageFormDialog({ isOpen, onClose, ...sessionOptions }: VoiceMessageFormDialogProps) {
  const formSession = useVoiceMessageFormSession(sessionOptions);

  return (
    <FormSheet
      open={isOpen}
      title={formSession.title}
      onClose={onClose}
      actions={<FormFooter {...formSession.saveProps} onCancel={onClose} buttonSize="large" />}
    >
      <VoiceMessageForm {...formSession.formProps} />
    </FormSheet>
  );
}
