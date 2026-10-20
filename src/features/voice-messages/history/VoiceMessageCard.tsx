import ExpandableRecordCard from "@/features/records/history/card/ExpandableRecordCard";
import RecordPeriodSummary from "@/features/records/history/card/RecordPeriodSummary";
import { isRecordActive } from "@/features/records/history/recordStatus";
import type { TraineeVoiceMessageRecordDto } from "@/types/voice-messages.schema";
import { buildVoiceMessageDetails, isAllCallsMessage, voiceMessageCardDomId } from "../voiceMessagesLogic";
import { VOICE_MESSAGES_TEXTS } from "../voiceMessagesTexts";

const CARD_TEXTS = VOICE_MESSAGES_TEXTS.card;

interface VoiceMessageCardProps {
  record: TraineeVoiceMessageRecordDto;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onCreateBasedOn: () => void;
}

/** כרטיס הודעה בהיסטוריה: המספר או "כל השיחות", ומתחתיו התאריכים והסטטוס (ספק 05 history §3.1-3.2) */
export default function VoiceMessageCard({ record, isOpen, onToggle, onEdit, onCreateBasedOn }: VoiceMessageCardProps) {
  const title =
    isAllCallsMessage(record) ? (
      <span className="truncate">{CARD_TEXTS.allCalls}</span>
    ) : (
      <span dir="ltr" className="whitespace-nowrap">
        {record.phoneNumber}
      </span>
    );

  return (
    <ExpandableRecordCard
      id={voiceMessageCardDomId(record.id)}
      icon="voiceMessage"
      iconTone="info"
      summaryTitle={title}
      summaryMeta={<RecordPeriodSummary record={record} activeLabel={CARD_TEXTS.activeBadge} />}
      details={buildVoiceMessageDetails(record)}
      isOpen={isOpen}
      onToggle={onToggle}
      isEnded={!isRecordActive(record)}
      onEdit={onEdit}
      createBasedOnLabel={CARD_TEXTS.createBasedOn}
      onCreateBasedOn={onCreateBasedOn}
    />
  );
}
