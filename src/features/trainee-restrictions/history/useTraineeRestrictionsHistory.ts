import { useCallback } from "react";
import { useDeviceNameResolver } from "@/features/records/deviceNames";
import type { HistorySortOption } from "@/features/records/history/historySort";
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
  // E-8: החיפוש בודק גם את שמות המכשירים, שמגיעים מרשימת מכשירי הפנימייה
  const deviceNameOf = useDeviceNameResolver();
  const filterAndSort = useCallback(
    (records: TraineeRestrictionRecordDto[], searchQuery: string, sort: HistorySortOption) =>
      filterAndSortTraineeRestrictions(records, searchQuery, sort, deviceNameOf),
    [deviceNameOf],
  );

  const history = useRecordHistoryState({
    records: restrictions,
    filterAndSort,
    cardDomIdOf: traineeRestrictionCardDomId,
  });
  const resultsCountText = buildTraineeRestrictionsCountText(history.visibleRecords);
  return { restrictions, history, resultsCountText };
}
