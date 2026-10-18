import DecisionBlock from "@/features/records/form/DecisionBlock";
import type { LookupItem } from "@/schemas/common.schema";
import type { TraineeVoiceMessageRecordDto } from "@/schemas/voice-messages.schema";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import MessageBlock from "./MessageBlock";
import MessageDetailsBlock from "./MessageDetailsBlock";
import type { VoiceMessageForm as VoiceMessageFormState } from "./useVoiceMessageForm";
import { VOICE_MESSAGE_FIELD_IDS } from "./voiceMessageFormLogic";

/** כפתור השמירה נמצא בפוטר של הטופס, מחוץ ל-<form>, ומשויך אליו לפי המזהה */
export const VOICE_MESSAGE_FORM_ID = "voice-message-form";

const DECISION_FIELD_IDS = {
  reason: VOICE_MESSAGE_FIELD_IDS.reason,
  details: VOICE_MESSAGE_FIELD_IDS.details,
  approver: VOICE_MESSAGE_FIELD_IDS.approver,
  file: VOICE_MESSAGE_FIELD_IDS.file,
};

interface VoiceMessageFormProps {
  form: VoiceMessageFormState;
  /** בעריכה - ההודעה, לכרטיס ההיקף הנעול */
  editRecord: TraineeVoiceMessageRecordDto | null;
  traineeFullName: string;
  reasons: AsyncResource<LookupItem<number>[]>;
}

/** שלושת הבלוקים של טופס ההודעה, מופרדים בקו: ההודעה, פרטי ההודעה, סיבות והחלטה (ספק 05 form §3) */
export default function VoiceMessageForm({ form, editRecord, traineeFullName, reasons }: VoiceMessageFormProps) {
  const { values, errors } = form;

  return (
    <form id={VOICE_MESSAGE_FORM_ID} noValidate onSubmit={form.submit} className="divide-y divide-divider">
      <MessageBlock form={form} editRecord={editRecord} traineeFullName={traineeFullName} />
      <MessageDetailsBlock form={form} />
      <DecisionBlock
        values={{
          reasonId: values.reasonId,
          details: values.details,
          approver: values.approver,
          approvedFile: values.approvedFile,
        }}
        errors={{ reason: errors.reason, details: errors.details, approver: errors.approver, file: errors.file }}
        reasons={reasons}
        fieldIds={DECISION_FIELD_IDS}
        onChange={form.changeDecision}
        onFileUploadingChange={form.setIsFileUploading}
      />
    </form>
  );
}
