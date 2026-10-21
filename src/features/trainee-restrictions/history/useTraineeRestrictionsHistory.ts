import { useRecordHistoryState, type RecordHistoryState } from "@/features/records/history/useRecordHistoryState";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { TraineeRestrictionRecordDto } from "@/types/trainee-restrictions.schema";
import {
  buildTraineeRestrictionsCountText,
  filterAndSortTraineeRestrictions,
  traineeRestrictionCardDomId,
} from "./traineeRestrictionsLogic";
import { useTraineeRestrictionsData } from "./useTraineeRestrictionsData";

interface TraineeRestrictionsHistory {
  restrictions: AsyncResource<TraineeRestrictionRecordDto[]>;
  history: RecordHistoryState<TraineeRestrictionRecordDto, number>;
  /** "מוצגות X הגבלות" - לפי הרשומות שמוצגות אחרי החיפוש */
  resultsCountText: string;
}

/** ההגבלות של החניך יחד עם מצב ההיסטוריה (חיפוש, מיון, כרטיס פתוח) - בלי ניווט ובלי תצוגה, לשתי הפריסות */
export function useTraineeRestrictionsHistory(traineeId: number): TraineeRestrictionsHistory {
  const restrictions = useTraineeRestrictionsData(traineeId);
  const history = useRecordHistoryState({
    records: restrictions,
    filterAndSort: filterAndSortTraineeRestrictions,
    cardDomIdOf: traineeRestrictionCardDomId,
  });
  const resultsCountText = buildTraineeRestrictionsCountText(history.visibleRecords);
  return { restrictions, history, resultsCountText };
}
