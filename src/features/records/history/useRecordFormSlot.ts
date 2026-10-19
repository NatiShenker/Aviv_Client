import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { FormSheetTarget } from "@/shells/mobile/navigation/useFormSheetRoute";
import { useNavigateBack } from "@/shells/mobile/navigation/useNavigateBack";
import type { DatedHistoryRecord } from "./historySort";
import { useHistoryFormTarget } from "./useHistoryFormTarget";

interface RecordFormSlotOptions<TRecord, TRecordRef, TSavedRecordKey> {
  formTarget: FormSheetTarget<TRecordRef> | null;
  records: AsyncResource<TRecord[]>;
  matchesRecordRef: (record: TRecord, recordRef: TRecordRef) => boolean;
  historyPath: string;
  onSaved: (savedRecordKey: TSavedRecordKey) => void;
}

/**
 * טופס היצירה / העריכה שמעל ההיסטוריה במובייל: הטופס שהכתובת מבקשת, סגירה בצעד אחורה,
 * ושמירה שחוזרת להיסטוריה עם הרשומה שנשמרה
 */
export function useRecordFormSlot<TRecord extends DatedHistoryRecord, TRecordRef, TSavedRecordKey>({
  formTarget,
  records,
  matchesRecordRef,
  historyPath,
  onSaved,
}: RecordFormSlotOptions<TRecord, TRecordRef, TSavedRecordKey>) {
  const close = useNavigateBack();
  const { openTarget, editRecord, basedOnRecord } = useHistoryFormTarget({
    formTarget,
    records,
    matchesRecordRef,
    historyPath,
  });

  const saveAndClose = (savedRecordKey: TSavedRecordKey) => {
    onSaved(savedRecordKey);
    close();
  };

  return { openTarget, editRecord, basedOnRecord, close, saveAndClose };
}
