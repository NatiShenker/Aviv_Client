import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import RecordHistoryLayout from "@/features/records/history/RecordHistoryLayout";
import { useRecordFormSlot } from "@/features/records/history/useRecordFormSlot";
import { useRecordHistoryState } from "@/features/records/history/useRecordHistoryState";
import { ROUTES } from "@/routes";
import type { TraineeVoiceMessageRecordDto } from "@/schemas/voice-messages.schema";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import { useVoiceMessageFormRoute } from "../form/useVoiceMessageFormRoute";
import VoiceMessageFormSheet from "../form/VoiceMessageFormSheet";
import { filterAndSortVoiceMessages, voiceMessageCardDomId } from "../voiceMessagesLogic";
import { VOICE_MESSAGES_TEXTS } from "../voiceMessagesTexts";
import { useVoiceMessagesData } from "./useVoiceMessagesData";
import VoiceMessageCard from "./VoiceMessageCard";

const getRecordKey = (record: TraineeVoiceMessageRecordDto) => record.id;

interface VoiceMessagesHistoryProps {
  traineeId: number;
  /** השם שמושמע בתוכן ההודעה */
  traineeFullName: string;
  /** כותרת המסך. נעוצה יחד עם שורת הכלים, והרשימה נגללת מתחת לשתיהן */
  header: ReactNode;
}

/**
 * כל ההודעות לנמען של החניך, כל מספר בכרטיס נפרד, עם חיפוש ומיון (ספק 05 history),
 * וטופס ההודעה מעליה (ספק 05 form).
 */
export default function VoiceMessagesHistory({ traineeId, traineeFullName, header }: VoiceMessagesHistoryProps) {
  const navigate = useNavigate();
  const voiceMessages = useVoiceMessagesData(traineeId);
  const history = useRecordHistoryState({
    records: voiceMessages,
    filterAndSort: filterAndSortVoiceMessages,
    cardDomIdOf: voiceMessageCardDomId,
  });

  const renderCard = (record: TraineeVoiceMessageRecordDto) => (
    <VoiceMessageCard
      record={record}
      isOpen={history.isRecordOpen(record.id)}
      onToggle={() => history.toggleRecord(record.id)}
      onEdit={() => navigate(ROUTES.editVoiceMessage(traineeId, record.id))}
      onCreateBasedOn={() => navigate(ROUTES.newVoiceMessage(traineeId, record.id))}
    />
  );

  return (
    <>
      <RecordHistoryLayout
        header={header}
        texts={VOICE_MESSAGES_TEXTS}
        records={voiceMessages}
        history={history}
        getRecordKey={getRecordKey}
        renderCard={renderCard}
        onCreate={() => navigate(ROUTES.newVoiceMessage(traineeId))}
      />
      <VoiceMessageFormSlot
        traineeId={traineeId}
        traineeFullName={traineeFullName}
        voiceMessages={voiceMessages}
        onSaved={history.showSavedRecord}
      />
    </>
  );
}

interface VoiceMessageFormSlotProps {
  traineeId: number;
  traineeFullName: string;
  voiceMessages: AsyncResource<TraineeVoiceMessageRecordDto[]>;
  onSaved: (savedRecordId: number) => void;
}

// הטופס נשאר mounted לאורך כל המסך, כדי שייסגר באנימציה גם כשהכתובת חוזרת להיסטוריה
function VoiceMessageFormSlot({ traineeId, traineeFullName, voiceMessages, onSaved }: VoiceMessageFormSlotProps) {
  const slot = useRecordFormSlot({
    formTarget: useVoiceMessageFormRoute(),
    records: voiceMessages,
    matchesRecordRef: (record, recordId) => record.id === recordId,
    historyPath: ROUTES.voiceMessages(traineeId),
    onSaved,
  });

  return (
    <VoiceMessageFormSheet
      target={slot.openTarget}
      traineeId={traineeId}
      traineeFullName={traineeFullName}
      editRecord={slot.editRecord}
      basedOnRecord={slot.basedOnRecord}
      onClose={slot.close}
      onSaved={slot.saveAndClose}
    />
  );
}
