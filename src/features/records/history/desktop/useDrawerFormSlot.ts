import { useEffect, useRef } from "react";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { RecordFormTarget } from "../../form/formStartingPoint";
import type { DatedHistoryRecord } from "../historySort";
import { useHistoryFormTarget } from "../useHistoryFormTarget";

interface DrawerFormSlotOptions<TRecord, TRecordRef> {
  formTarget: RecordFormTarget<TRecordRef>;
  records: AsyncResource<TRecord[]>;
  matchesRecordRef: (record: TRecord, recordRef: TRecordRef) => boolean;
  /** סגירת הטופס, וחזרה להיסטוריה */
  onClose: () => void;
}

/**
 * הטופס שמעל ההיסטוריה במגירה - המקבילה של useRecordFormSlot במובייל, בלי כתובות:
 * הרשומה לעריכה או ל"על בסיס" נלקחת מההיסטוריה שנטענה, ועריכה של רשומה שכבר לא זמינה
 * (הוחלפה בגרסה חדשה, או הסתיימה) סוגרת את הטופס
 */
export function useDrawerFormSlot<TRecord extends DatedHistoryRecord, TRecordRef>({
  formTarget,
  records,
  matchesRecordRef,
  onClose,
}: DrawerFormSlotOptions<TRecord, TRecordRef>) {
  const { openTarget, editRecord, basedOnRecord, isEditTargetUnavailable } = useHistoryFormTarget({
    formTarget,
    records,
    matchesRecordRef,
  });
  // ב-ref, כדי שרק שינוי הזמינות יפעיל את הסגירה, ולא כל רינדור
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (isEditTargetUnavailable) {
      onCloseRef.current();
    }
  }, [isEditTargetUnavailable]);

  return { openTarget, editRecord, basedOnRecord };
}
