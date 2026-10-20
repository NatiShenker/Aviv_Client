import DrawerRecordFormFrame from "@/features/records/desktop/DrawerRecordFormFrame";
import { useDrawerFormSlot } from "@/features/records/desktop/useDrawerFormSlot";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { TraineeVoiceMessageRecordDto } from "@/types/voice-messages.schema";
import { useVoiceMessageFormSession, type VoiceMessageFormTarget } from "../form/useVoiceMessageFormSession";
import VoiceMessageForm from "../form/VoiceMessageForm";
import { matchesVoiceMessageId } from "../voiceMessagesLogic";

interface VoiceMessageDrawerFormProps {
  target: VoiceMessageFormTarget;
  traineeId: number;
  /** השם שמושמע בתוכן ההודעה */
  traineeFullName: string;
  /** ההיסטוריה שכבר נטענה: ההודעה לעריכה או ל"על בסיס" נלקחת ממנה */
  voiceMessages: AsyncResource<TraineeVoiceMessageRecordDto[]>;
  onClose: () => void;
  onSaved: (savedRecordId: number) => void;
}

/** טופס ההודעה לנמען במגירה: שכבה מעל ההיסטוריה (ספק 05 form, פריסת דסקטופ) */
export default function VoiceMessageDrawerForm({
  target,
  traineeId,
  traineeFullName,
  voiceMessages,
  onClose,
  onSaved,
}: VoiceMessageDrawerFormProps) {
  const slot = useDrawerFormSlot({ formTarget: target, records: voiceMessages, matchesRecordRef: matchesVoiceMessageId, onClose });

  // הטופס מאתחל את ערכיו פעם אחת כשהוא עולה, ולכן הוא עולה רק כשההודעה שהוא מתחיל ממנה זמינה
  if (slot.openTarget === null) {
    return null;
  }

  return (
    <VoiceMessageDrawerFormContent
      target={slot.openTarget}
      traineeId={traineeId}
      traineeFullName={traineeFullName}
      editRecord={slot.editRecord}
      basedOnRecord={slot.basedOnRecord}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

interface VoiceMessageDrawerFormContentProps {
  target: VoiceMessageFormTarget;
  traineeId: number;
  traineeFullName: string;
  editRecord: TraineeVoiceMessageRecordDto | null;
  basedOnRecord: TraineeVoiceMessageRecordDto | null;
  onClose: () => void;
  onSaved: (savedRecordId: number) => void;
}

function VoiceMessageDrawerFormContent({ onClose, ...sessionOptions }: VoiceMessageDrawerFormContentProps) {
  const formSession = useVoiceMessageFormSession(sessionOptions);

  return (
    <DrawerRecordFormFrame session={formSession} onClose={onClose}>
      <VoiceMessageForm {...formSession.formProps} />
    </DrawerRecordFormFrame>
  );
}
