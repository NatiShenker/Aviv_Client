import { useState, type ReactNode } from "react";
import DrawerHistoryLayout from "@/features/records/history/desktop/DrawerHistoryLayout";
import type { TraineeVoiceMessageRecordDto } from "@/schemas/voice-messages.schema";
import type { VoiceMessageFormTarget } from "../form/useVoiceMessageFormRoute";
import { useVoiceMessagesHistory } from "../history/useVoiceMessagesHistory";
import VoiceMessageCard from "../history/VoiceMessageCard";
import { VOICE_MESSAGES_TEXTS } from "../voiceMessagesTexts";

const getRecordKey = (record: TraineeVoiceMessageRecordDto) => record.id;

interface VoiceMessagesDrawerHistoryProps {
  traineeId: number;
  /** חזרה ושם הפעולה, בתחילת השורה העליונה */
  navigation: ReactNode;
}

/** ההודעות לנמען של החניך במגירה (ספק 05 history, פריסת דסקטופ) */
export default function VoiceMessagesDrawerHistory({ traineeId, navigation }: VoiceMessagesDrawerHistoryProps) {
  const { voiceMessages, history } = useVoiceMessagesHistory(traineeId);
  // הטופס שנפתח מעל ההיסטוריה. בזכרון בלבד, כמו כל המגירה
  const [, setFormTarget] = useState<VoiceMessageFormTarget | null>(null);

  const renderCard = (record: TraineeVoiceMessageRecordDto) => (
    <VoiceMessageCard
      record={record}
      isOpen={history.isRecordOpen(record.id)}
      onToggle={() => history.toggleRecord(record.id)}
      onEdit={() => setFormTarget({ mode: "edit", recordRef: record.id })}
      onCreateBasedOn={() => setFormTarget({ mode: "create", basedOnRef: record.id })}
    />
  );

  return (
    <DrawerHistoryLayout
      navigation={navigation}
      texts={VOICE_MESSAGES_TEXTS}
      records={voiceMessages}
      history={history}
      getRecordKey={getRecordKey}
      renderCard={renderCard}
      onCreate={() => setFormTarget({ mode: "create", basedOnRef: null })}
    />
  );
}
