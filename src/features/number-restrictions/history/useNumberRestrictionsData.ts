import type { TraineePhoneRecordDto } from "@/schemas/phone-exceptions.schema";
import { getTraineePhoneRecords } from "@/services/phoneExceptionsService";
import { isEmptyList, useAsyncResource, type AsyncResource } from "@/shared/hooks/useAsyncResource";

/**
 * ההגבלות וההיתרים של החניך למספרים. נטענים מהשרת בכל כניסה למסך, בלי זכרון:
 * ההיסטוריה היא הבסיס להחלטות, וצוות אחר יכול לשנות אותה בינתיים.
 */
export function useNumberRestrictionsData(traineeId: number): AsyncResource<TraineePhoneRecordDto[]> {
  return useAsyncResource({
    requestKey: traineeId,
    load: getTraineePhoneRecords,
    isEmpty: isEmptyList,
  });
}
