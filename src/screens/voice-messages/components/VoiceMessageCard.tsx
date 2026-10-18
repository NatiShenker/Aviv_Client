import type { TraineeVoiceMessageRecordDto } from "@/schemas/voice-messages.schema";
import ExpandableRecordCard from "@/shared/components/history/ExpandableRecordCard";
import { isRecordActive } from "@/shared/components/history/historySort";
import RecordPeriodSummary from "@/shared/components/history/RecordPeriodSummary";
import { buildVoiceMessageDetails, voiceMessageCardDomId } from "../voiceMessagesLogic";
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
    record.phoneNumber === null ? (
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
