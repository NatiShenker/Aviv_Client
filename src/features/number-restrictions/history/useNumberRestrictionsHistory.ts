import { useRecordHistoryState, type RecordHistoryState } from "@/features/records/history/useRecordHistoryState";
import type { TraineePhoneRecordDto } from "@/schemas/phone-exceptions.schema";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import { filterAndSortNumberRecords, numberRecordCardDomId } from "../numberRestrictionsLogic";
import { useNumberRestrictionsData } from "./useNumberRestrictionsData";

interface NumberRestrictionsHistory {
  phoneRecords: AsyncResource<TraineePhoneRecordDto[]>;
  /** מפתח הרשומה הוא הסוג והמזהה, למשל "permit-12" */
  history: RecordHistoryState<TraineePhoneRecordDto, string>;
}

/** ההגבלות וההיתרים של החניך למספרים יחד עם מצב ההיסטוריה - בלי ניווט ובלי תצוגה, לשתי הפריסות */
export function useNumberRestrictionsHistory(traineeId: number): NumberRestrictionsHistory {
  const phoneRecords = useNumberRestrictionsData(traineeId);
  const history = useRecordHistoryState({
    records: phoneRecords,
    filterAndSort: filterAndSortNumberRecords,
    cardDomIdOf: numberRecordCardDomId,
  });
  return { phoneRecords, history };
}
