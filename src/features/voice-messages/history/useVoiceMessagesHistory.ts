import { useRecordHistoryState, type RecordHistoryState } from "@/features/records/history/useRecordHistoryState";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { TraineeVoiceMessageRecordDto } from "@/types/voice-messages.schema";
import { buildVoiceMessagesCountText, filterAndSortVoiceMessages, voiceMessageCardDomId } from "../voiceMessagesLogic";
import { useVoiceMessagesData } from "./useVoiceMessagesData";

interface VoiceMessagesHistory {
  voiceMessages: AsyncResource<TraineeVoiceMessageRecordDto[]>;
  history: RecordHistoryState<TraineeVoiceMessageRecordDto, number>;
  /** "מוצגות X הודעות" - לפי ההודעות שמוצגות אחרי החיפוש */
  resultsCountText: string;
}

/** ההודעות לנמען של החניך יחד עם מצב ההיסטוריה - בלי ניווט ובלי תצוגה, לשתי הפריסות */
export function useVoiceMessagesHistory(traineeId: number): VoiceMessagesHistory {
  const voiceMessages = useVoiceMessagesData(traineeId);
  const history = useRecordHistoryState({
    records: voiceMessages,
    filterAndSort: filterAndSortVoiceMessages,
    cardDomIdOf: voiceMessageCardDomId,
  });
  const resultsCountText = buildVoiceMessagesCountText(history.visibleRecords);
  return { voiceMessages, history, resultsCountText };
}
