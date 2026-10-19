import type { TraineeVoiceMessageRecordDto } from "@/schemas/voice-messages.schema";
import { getTraineeVoiceMessages } from "@/services/voiceMessagesService";
import { isEmptyList, useAsyncResource, type AsyncResource } from "@/shared/hooks/useAsyncResource";

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
