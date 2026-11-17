import type { ReactNode } from "react";
import { ROUTE_PATTERNS, ROUTES, parseRouteId } from "@/config/routes";
import RecordHistoryLayout from "@/features/records/mobile/RecordHistoryLayout";
import { useRecordFormRoute } from "@/features/records/mobile/useRecordFormRoute";
import { useRecordFormSlot } from "@/features/records/mobile/useRecordFormSlot";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import { useAppNavigate } from "@/shells/mobile/navigation/useAppNavigate";
import type { TraineeVoiceMessageRecordDto } from "@/types/voice-messages.schema";
import type { VoiceMessageFormTarget } from "../form/useVoiceMessageFormSession";
import { useVoiceMessagesHistory } from "../history/useVoiceMessagesHistory";
import VoiceMessageCard from "../history/VoiceMessageCard";
import { matchesVoiceMessageId, voiceMessageRecordKey } from "../voiceMessagesLogic";
import { VOICE_MESSAGES_TEXTS } from "../voiceMessagesTexts";
import VoiceMessageFormSheet from "./VoiceMessageFormSheet";

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
  const navigate = useAppNavigate();
  const { voiceMessages, history, resultsCountText } = useVoiceMessagesHistory(traineeId);

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
        resultsCountText={resultsCountText}
        getRecordKey={voiceMessageRecordKey}
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
    matchesRecordRef: matchesVoiceMessageId,
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

/** הטופס שהכתובת מבקשת לפתוח. null = הכתובת היא של ההיסטוריה עצמה, ומגירת הטופס סגורה */
function useVoiceMessageFormRoute(): VoiceMessageFormTarget | null {
  return useRecordFormRoute({
    createPattern: ROUTE_PATTERNS.newVoiceMessage,
    editPattern: ROUTE_PATTERNS.editVoiceMessage,
    recordParam: "recordId",
    parseRecordRef: parseRouteId,
  });
}
