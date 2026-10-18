import type { TraineeVoiceMessageRecordDto } from "@/schemas/voice-messages.schema";
import { getTraineeVoiceMessages } from "@/services/voiceMessagesService";
import { useAsyncResource, type AsyncResource } from "@/shared/hooks/useAsyncResource";

const isEmptyList = (list: unknown[]) => list.length === 0;

/**
 * ההודעות לנמען של החניך. נטענות מהשרת בכל כניסה למסך, בלי זכרון:
 * ההיסטוריה היא הבסיס להחלטות, וצוות אחר יכול לשנות אותה בינתיים.
 */
export function useVoiceMessagesData(traineeId: number): AsyncResource<TraineeVoiceMessageRecordDto[]> {
  return useAsyncResource({
    requestKey: traineeId,
    load: getTraineeVoiceMessages,
    isEmpty: isEmptyList,
  });
}
