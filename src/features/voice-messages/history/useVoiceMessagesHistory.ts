import { useRecordHistoryState, type RecordHistoryState } from "@/features/records/history/useRecordHistoryState";
import type { TraineeVoiceMessageRecordDto } from "@/schemas/voice-messages.schema";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import { filterAndSortVoiceMessages, voiceMessageCardDomId } from "../voiceMessagesLogic";
import { useVoiceMessagesData } from "./useVoiceMessagesData";

interface VoiceMessagesHistory {
  voiceMessages: AsyncResource<TraineeVoiceMessageRecordDto[]>;
  history: RecordHistoryState<TraineeVoiceMessageRecordDto, number>;
}

/** ההודעות לנמען של החניך יחד עם מצב ההיסטוריה - בלי ניווט ובלי תצוגה, לשתי הפריסות */
export function useVoiceMessagesHistory(traineeId: number): VoiceMessagesHistory {
  const voiceMessages = useVoiceMessagesData(traineeId);
  const history = useRecordHistoryState({
    records: voiceMessages,
    filterAndSort: filterAndSortVoiceMessages,
    cardDomIdOf: voiceMessageCardDomId,
  });
  return { voiceMessages, history };
}
