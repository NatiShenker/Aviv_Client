import { useRecordHistoryState, type RecordHistoryState } from "@/features/records/history/useRecordHistoryState";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { TraineeRestrictionRecordDto } from "@/types/trainee-restrictions.schema";
import { filterAndSortTraineeRestrictions, traineeRestrictionCardDomId } from "./traineeRestrictionsLogic";
import { useTraineeRestrictionsData } from "./useTraineeRestrictionsData";

interface TraineeRestrictionsHistory {
  restrictions: AsyncResource<TraineeRestrictionRecordDto[]>;
  history: RecordHistoryState<TraineeRestrictionRecordDto, number>;
}

/** ההגבלות של החניך יחד עם מצב ההיסטוריה (חיפוש, מיון, כרטיס פתוח) - בלי ניווט ובלי תצוגה, לשתי הפריסות */
export function useTraineeRestrictionsHistory(traineeId: number): TraineeRestrictionsHistory {
  const restrictions = useTraineeRestrictionsData(traineeId);
  const history = useRecordHistoryState({
    records: restrictions,
    filterAndSort: filterAndSortTraineeRestrictions,
    cardDomIdOf: traineeRestrictionCardDomId,
  });
  return { restrictions, history };
}
