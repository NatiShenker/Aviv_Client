import type { RecordFormTarget } from "@/features/records/form/formStartingPoint";
import { useRecordFormRoute } from "@/features/records/form/useRecordFormRoute";
import { ROUTE_PATTERNS } from "@/routes";
import { parseNumberRecordKey, type NumberRecordRef } from "../numberRestrictionsLogic";

/** הטופס שהכתובת מבקשת לפתוח מעל ההיסטוריה. בעריכה (או ביצירה על בסיס רשומה) - סוג הרשומה והמזהה שלה */
export type NumberRecordFormTarget = RecordFormTarget<NumberRecordRef>;

/** null = הכתובת היא של ההיסטוריה עצמה, ומגירת הטופס סגורה */
export function useNumberRecordFormRoute(): NumberRecordFormTarget | null {
  return useRecordFormRoute({
    createPattern: ROUTE_PATTERNS.newNumberRecord,
    editPattern: ROUTE_PATTERNS.editNumberRecord,
    recordParam: "recordKey",
    parseRecordRef: parseNumberRecordKey,
  });
}
