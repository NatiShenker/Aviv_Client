import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { FormSheetTarget } from "@/shared/navigation/useFormSheetRoute";

interface HistoryFormTargetOptions<TRecord, TRecordRef> {
  formTarget: FormSheetTarget<TRecordRef> | null;
  /** ההיסטוריה שכבר נטענה. בעריכה הרשומה נלקחת ממנה */
  records: AsyncResource<TRecord[]>;
  matchesRecordRef: (record: TRecord, recordRef: TRecordRef) => boolean;
  historyPath: string;
}

interface HistoryFormTarget<TRecord, TRecordRef> {
  /** הטופס שייפתח. בעריכה - רק כשהרשומה כבר קיימת בהיסטוריה */
  openTarget: FormSheetTarget<TRecordRef> | null;
  editRecord: TRecord | null;
}

/**
 * הטופס שמעל ההיסטוריה: בעריכה הרשומה נמצאת בהיסטוריה שנטענה.
 * רשומה שלא קיימת (למשל כתובת ישנה) מחזירה להיסטוריה, במקום הכתובת הנוכחית (ספק 03-04 form §2).
 */
export function useHistoryFormTarget<TRecord, TRecordRef>({
  formTarget,
  records,
  matchesRecordRef,
  historyPath,
}: HistoryFormTargetOptions<TRecord, TRecordRef>): HistoryFormTarget<TRecord, TRecordRef> {
  const navigate = useNavigate();

  const editRecordRef = formTarget?.mode === "edit" ? formTarget.recordRef : null;
  const editRecord =
    editRecordRef === null ? null : records.data?.find((record) => matchesRecordRef(record, editRecordRef)) ?? null;
  const isEditRecordMissing = editRecordRef !== null && records.status === "success" && editRecord === null;
  const openTarget = editRecordRef !== null && editRecord === null ? null : formTarget;

  useEffect(() => {
    if (isEditRecordMissing) {
      navigate(historyPath, { replace: true });
    }
  }, [isEditRecordMissing, navigate, historyPath]);

  return { openTarget, editRecord };
}
