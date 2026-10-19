import FormFooter from "@/features/records/form/FormFooter";
import { useDrawerFormSlot } from "@/features/records/history/desktop/useDrawerFormSlot";
import type { TraineeVoiceMessageRecordDto } from "@/schemas/voice-messages.schema";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import DrawerFormLayer from "@/shells/desktop/DrawerFormLayer";
import { useReportUnsavedChanges } from "@/shells/desktop/unsavedChanges";
import { useVoiceMessageFormSession } from "../form/useVoiceMessageFormSession";
import type { VoiceMessageFormTarget } from "../form/useVoiceMessageFormRoute";
import VoiceMessageForm from "../form/VoiceMessageForm";

const matchesVoiceMessageId = (record: TraineeVoiceMessageRecordDto, recordId: number) => record.id === recordId;

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
  useReportUnsavedChanges(formSession.hasUserChanges);

  return (
    <DrawerFormLayer
      title={formSession.title}
      onClose={onClose}
      footer={<FormFooter {...formSession.saveProps} onCancel={onClose} buttonSize="medium" />}
    >
      <VoiceMessageForm {...formSession.formProps} />
    </DrawerFormLayer>
  );
}
