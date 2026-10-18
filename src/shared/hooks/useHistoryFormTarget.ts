import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isRecordActive, type DatedHistoryRecord } from "@/shared/components/history/historySort";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { FormSheetTarget } from "@/shared/navigation/useFormSheetRoute";

interface HistoryFormTargetOptions<TRecord, TRecordRef> {
  formTarget: FormSheetTarget<TRecordRef> | null;
  /** ההיסטוריה שכבר נטענה. בעריכה וביצירה על בסיס רשומה, הרשומה נלקחת ממנה */
  records: AsyncResource<TRecord[]>;
  matchesRecordRef: (record: TRecord, recordRef: TRecordRef) => boolean;
  historyPath: string;
}

interface HistoryFormTarget<TRecord, TRecordRef> {
  /** הטופס שייפתח. בעריכה - רק כשהרשומה קיימת ועדיין פעילה; ביצירה על בסיס רשומה - אחרי שההיסטוריה נטענה */
  openTarget: FormSheetTarget<TRecordRef> | null;
  editRecord: TRecord | null;
  /** הרשומה שהסתיימה שהטופס החדש מתחיל ממנה, או null */
  basedOnRecord: TRecord | null;
}

/**
 * הטופס שמעל ההיסטוריה: בעריכה וביצירה על בסיס רשומה, הרשומה נמצאת בהיסטוריה שנטענה.
 * עריכה של רשומה שלא קיימת (כתובת ישנה) או שהסתיימה (רשומה שהסתיימה לא נערכת - ספק 00 §3.22)
 * מחזירה להיסטוריה, במקום הכתובת הנוכחית. מקור שלא נמצא פותח יצירה רגילה.
 */
export function useHistoryFormTarget<TRecord extends DatedHistoryRecord, TRecordRef>({
  formTarget,
  records,
  matchesRecordRef,
  historyPath,
}: HistoryFormTargetOptions<TRecord, TRecordRef>): HistoryFormTarget<TRecord, TRecordRef> {
  const navigate = useNavigate();
  const findRecord = (recordRef: TRecordRef | null): TRecord | null =>
    recordRef === null ? null : records.data?.find((record) => matchesRecordRef(record, recordRef)) ?? null;

  const editRecordRef = formTarget?.mode === "edit" ? formTarget.recordRef : null;
  const foundEditRecord = findRecord(editRecordRef);
  const editRecord = foundEditRecord && isRecordActive(foundEditRecord) ? foundEditRecord : null;
  const isEditRecordUnavailable = editRecordRef !== null && records.status === "success" && editRecord === null;

  const basedOnRef = formTarget?.mode === "create" ? formTarget.basedOnRef : null;
  const basedOnRecord = findRecord(basedOnRef);
  // הטופס מאתחל את ערכיו פעם אחת כשהוא נפתח, ולכן הוא מחכה להיסטוריה כדי להתחיל מהרשומה
  const isWaitingForBasedOnRecord = basedOnRef !== null && (records.status === "idle" || records.status === "loading");

  const isWaiting = (editRecordRef !== null && editRecord === null) || isWaitingForBasedOnRecord;
  const openTarget = isWaiting ? null : formTarget;

  useEffect(() => {
    if (isEditRecordUnavailable) {
      navigate(historyPath, { replace: true });
    }
  }, [isEditRecordUnavailable, navigate, historyPath]);

  return { openTarget, editRecord, basedOnRecord };
}
