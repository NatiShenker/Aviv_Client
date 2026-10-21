import { useRecordHistoryState, type RecordHistoryState } from "@/features/records/history/useRecordHistoryState";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { TraineePhoneRecordDto } from "@/types/phone-exceptions.schema";
import {
  buildNumberRecordsCountText,
  filterAndSortNumberRecords,
  numberRecordCardDomId,
} from "../numberRestrictionsLogic";
import { useNumberRestrictionsData } from "./useNumberRestrictionsData";

interface NumberRestrictionsHistory {
  phoneRecords: AsyncResource<TraineePhoneRecordDto[]>;
  /** מפתח הרשומה הוא הסוג והמזהה, למשל "permit-12" */
  history: RecordHistoryState<TraineePhoneRecordDto, string>;
  /** "מוצגים X הגבלות והיתרים" - לפי הרשומות שמוצגות אחרי החיפוש */
  resultsCountText: string;
}

/** ההגבלות וההיתרים של החניך למספרים יחד עם מצב ההיסטוריה - בלי ניווט ובלי תצוגה, לשתי הפריסות */
export function useNumberRestrictionsHistory(traineeId: number): NumberRestrictionsHistory {
  const phoneRecords = useNumberRestrictionsData(traineeId);
  const history = useRecordHistoryState({
    records: phoneRecords,
    filterAndSort: filterAndSortNumberRecords,
    cardDomIdOf: numberRecordCardDomId,
  });
  const resultsCountText = buildNumberRecordsCountText(history.visibleRecords);
  return { phoneRecords, history, resultsCountText };
}
