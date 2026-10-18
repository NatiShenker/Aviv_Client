import type { TraineeRestrictionRecordDto } from "@/schemas/trainee-restrictions.schema";
import { getTraineeRestrictions } from "@/services/traineeRestrictionsService";
import { useAsyncResource, type AsyncResource } from "@/shared/hooks/useAsyncResource";

const isEmptyList = (list: unknown[]) => list.length === 0;

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
