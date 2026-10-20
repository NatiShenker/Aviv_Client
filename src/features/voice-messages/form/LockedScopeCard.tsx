import RecordIconCircle from "@/features/records/history/card/RecordIconCircle";
import type { TraineeVoiceMessageRecordDto } from "@/types/voice-messages.schema";
import { isAllCallsMessage } from "../voiceMessagesLogic";
import { VOICE_MESSAGES_TEXTS } from "../voiceMessagesTexts";

const FORM_TEXTS = VOICE_MESSAGES_TEXTS.form;
const SCOPE_TEXTS = FORM_TEXTS.messageBlock.scopes;

interface LockedScopeCardProps {
  record: TraineeVoiceMessageRecordDto;
}

/** בעריכה, במקום בחירת ההיקף: המספר (או "בכל השיחות") נעול (כמו הכרטיס הנעול בספק 04 form §3.3) */
export default function LockedScopeCard({ record }: LockedScopeCardProps) {
  const isAllCalls = isAllCallsMessage(record);

  return (
    <div className="rounded-card border border-divider bg-paper p-4">
      <div className="flex items-center gap-3">
        <RecordIconCircle icon="voiceMessage" tone="info" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-base text-text-primary">
            {isAllCalls ? SCOPE_TEXTS.all.label : <span dir="ltr">{record.phoneNumber}</span>}
          </p>
          <p className="text-sm text-text-muted">
            {isAllCalls ? SCOPE_TEXTS.all.description : FORM_TEXTS.lockedScope.selected}
          </p>
        </div>
      </div>
    </div>
  );
}
