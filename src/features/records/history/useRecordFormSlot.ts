import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import { useNavigateBack } from "@/shells/mobile/navigation/useNavigateBack";
import type { RecordFormTarget } from "../form/formStartingPoint";
import type { DatedHistoryRecord } from "./historySort";
import { useHistoryFormTarget } from "./useHistoryFormTarget";

interface RecordFormSlotOptions<TRecord, TRecordRef, TSavedRecordKey> {
  formTarget: RecordFormTarget<TRecordRef> | null;
  records: AsyncResource<TRecord[]>;
  matchesRecordRef: (record: TRecord, recordRef: TRecordRef) => boolean;
  historyPath: string;
  onSaved: (savedRecordKey: TSavedRecordKey) => void;
}

/**
 * טופס היצירה / העריכה שמעל ההיסטוריה במובייל: הטופס שהכתובת מבקשת, סגירה בצעד אחורה,
 * שמירה שחוזרת להיסטוריה עם הרשומה שנשמרה, וכתובת עריכה של רשומה לא זמינה שמוחלפת בכתובת ההיסטוריה
 */
export function useRecordFormSlot<TRecord extends DatedHistoryRecord, TRecordRef, TSavedRecordKey>({
  formTarget,
  records,
  matchesRecordRef,
  historyPath,
  onSaved,
}: RecordFormSlotOptions<TRecord, TRecordRef, TSavedRecordKey>) {
  const navigate = useNavigate();
  const close = useNavigateBack();
  const { openTarget, editRecord, basedOnRecord, isEditTargetUnavailable } = useHistoryFormTarget({
    formTarget,
    records,
    matchesRecordRef,
  });

  useEffect(() => {
    if (isEditTargetUnavailable) {
      navigate(historyPath, { replace: true });
    }
  }, [isEditTargetUnavailable, navigate, historyPath]);

  const saveAndClose = (savedRecordKey: TSavedRecordKey) => {
    onSaved(savedRecordKey);
    close();
  };

  return { openTarget, editRecord, basedOnRecord, close, saveAndClose };
}
