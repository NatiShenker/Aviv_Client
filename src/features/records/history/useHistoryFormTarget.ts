import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { RecordFormTarget } from "../form/formStartingPoint";
import { isRecordActive, type DatedHistoryRecord } from "./historySort";

interface HistoryFormTargetOptions<TRecord, TRecordRef> {
  formTarget: RecordFormTarget<TRecordRef> | null;
  /** ההיסטוריה שכבר נטענה. בעריכה וביצירה על בסיס רשומה, הרשומה נלקחת ממנה */
  records: AsyncResource<TRecord[]>;
  matchesRecordRef: (record: TRecord, recordRef: TRecordRef) => boolean;
}

interface HistoryFormTarget<TRecord, TRecordRef> {
  /** הטופס שייפתח. בעריכה - רק כשהרשומה קיימת ועדיין פעילה; ביצירה על בסיס רשומה - אחרי שההיסטוריה נטענה */
  openTarget: RecordFormTarget<TRecordRef> | null;
  editRecord: TRecord | null;
  /** הרשומה שהסתיימה שהטופס החדש מתחיל ממנה, או null */
  basedOnRecord: TRecord | null;
  /** מבוקשת עריכה של רשומה שלא קיימת בהיסטוריה שנטענה, או שהסתיימה. המעטפת מחזירה לרשימה */
  isEditTargetUnavailable: boolean;
}

/**
 * הטופס שמעל ההיסטוריה: בעריכה וביצירה על בסיס רשומה, הרשומה נמצאת בהיסטוריה שנטענה.
 * עריכה של רשומה שלא קיימת (כתובת ישנה) או שהסתיימה (רשומה שהסתיימה לא נערכת - ספק 00 §3.22)
 * לא נפתחת, ומסומנת כלא זמינה. מקור שלא נמצא פותח יצירה רגילה. בלי ניווט ובלי תצוגה.
 */
export function useHistoryFormTarget<TRecord extends DatedHistoryRecord, TRecordRef>({
  formTarget,
  records,
  matchesRecordRef,
}: HistoryFormTargetOptions<TRecord, TRecordRef>): HistoryFormTarget<TRecord, TRecordRef> {
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

  return { openTarget, editRecord, basedOnRecord, isEditTargetUnavailable: isEditRecordUnavailable };
}
