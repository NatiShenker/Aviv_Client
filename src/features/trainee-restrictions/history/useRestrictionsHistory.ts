import { useRecordHistoryState, type RecordHistoryState } from "@/features/records/history/useRecordHistoryState";
import type { TraineeRestrictionRecordDto } from "@/schemas/trainee-restrictions.schema";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import { filterAndSortRestrictions, restrictionCardDomId } from "./traineeRestrictionsLogic";
import { useTraineeRestrictionsData } from "./useTraineeRestrictionsData";

interface RestrictionsHistory {
  restrictions: AsyncResource<TraineeRestrictionRecordDto[]>;
  history: RecordHistoryState<TraineeRestrictionRecordDto, number>;
}

/** ההגבלות של החניך יחד עם מצב ההיסטוריה (חיפוש, מיון, כרטיס פתוח) - בלי ניווט ובלי תצוגה, לשתי הפריסות */
export function useRestrictionsHistory(traineeId: number): RestrictionsHistory {
  const restrictions = useTraineeRestrictionsData(traineeId);
  const history = useRecordHistoryState({
    records: restrictions,
    filterAndSort: filterAndSortRestrictions,
    cardDomIdOf: restrictionCardDomId,
  });
  return { restrictions, history };
}
