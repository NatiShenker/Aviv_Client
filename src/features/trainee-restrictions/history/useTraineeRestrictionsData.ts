import { getTraineeRestrictions } from "@/services/traineeRestrictionsService";
import { isEmptyList, useAsyncResource, type AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { TraineeRestrictionRecordDto } from "@/types/trainee-restrictions.schema";

/**
 * ההגבלות של החניך. נטענות מהשרת בכל כניסה למסך, בלי זכרון:
 * ההיסטוריה היא הבסיס להחלטות, וצוות אחר יכול לשנות אותה בינתיים.
 */
export function useTraineeRestrictionsData(traineeId: number): AsyncResource<TraineeRestrictionRecordDto[]> {
  return useAsyncResource({
    requestKey: traineeId,
    load: getTraineeRestrictions,
    isEmpty: isEmptyList,
  });
}
