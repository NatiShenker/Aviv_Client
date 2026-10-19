import { useState, type ReactNode } from "react";
import DrawerHistoryLayout from "@/features/records/history/desktop/DrawerHistoryLayout";
import type { TraineeVoiceMessageRecordDto } from "@/schemas/voice-messages.schema";
import DrawerFormHost from "@/shells/desktop/DrawerFormHost";
import type { VoiceMessageFormTarget } from "../form/useVoiceMessageFormRoute";
import { useVoiceMessagesHistory } from "../history/useVoiceMessagesHistory";
import VoiceMessageCard from "../history/VoiceMessageCard";
import { VOICE_MESSAGES_TEXTS } from "../voiceMessagesTexts";
import VoiceMessageDrawerForm from "./VoiceMessageDrawerForm";

const getRecordKey = (record: TraineeVoiceMessageRecordDto) => record.id;

interface VoiceMessagesDrawerHistoryProps {
  traineeId: number;
  /** השם שמושמע בתוכן ההודעה */
  traineeFullName: string;
  /** חזרה ושם הפעולה, בתחילת השורה העליונה */
  navigation: ReactNode;
  /** אחרי שמירה - למשל כדי שרשימת החניכים שמאחור תתעדכן */
  onRecordSaved: () => void;
}

/** ההודעות לנמען של החניך במגירה, וטופס ההודעה מעליה (ספק 05, פריסת דסקטופ) */
export default function VoiceMessagesDrawerHistory({
  traineeId,
  traineeFullName,
  navigation,
  onRecordSaved,
}: VoiceMessagesDrawerHistoryProps) {
  const { voiceMessages, history } = useVoiceMessagesHistory(traineeId);
  // הטופס שנפתח מעל ההיסטוריה. בזכרון בלבד, כמו כל המגירה
  const [formTarget, setFormTarget] = useState<VoiceMessageFormTarget | null>(null);

  // אחרי שמירה: חזרה להיסטוריה, עם ההודעה הראשונה שנשמרה פתוחה (ספק 00 §4.1)
  const handleSaved = (savedRecordId: number) => {
    setFormTarget(null);
    history.showSavedRecord(savedRecordId);
    onRecordSaved();
  };

  const renderCard = (record: TraineeVoiceMessageRecordDto) => (
    <VoiceMessageCard
      record={record}
      isOpen={history.isRecordOpen(record.id)}
      onToggle={() => history.toggleRecord(record.id)}
      onEdit={() => setFormTarget({ mode: "edit", recordRef: record.id })}
      onCreateBasedOn={() => setFormTarget({ mode: "create", basedOnRef: record.id })}
    />
  );

  const renderForm = (target: VoiceMessageFormTarget) => (
    <VoiceMessageDrawerForm
      target={target}
      traineeId={traineeId}
      traineeFullName={traineeFullName}
      voiceMessages={voiceMessages}
      onClose={() => setFormTarget(null)}
      onSaved={handleSaved}
    />
  );

  return (
    <DrawerFormHost formTarget={formTarget} renderForm={renderForm}>
      <DrawerHistoryLayout
        navigation={navigation}
        texts={VOICE_MESSAGES_TEXTS}
        records={voiceMessages}
        history={history}
        getRecordKey={getRecordKey}
        renderCard={renderCard}
        onCreate={() => setFormTarget({ mode: "create", basedOnRef: null })}
      />
    </DrawerFormHost>
  );
}
