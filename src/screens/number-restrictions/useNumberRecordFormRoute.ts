import { ROUTE_PATTERNS } from "@/routes";
import { useFormSheetRoute, type FormSheetTarget } from "@/shared/navigation/useFormSheetRoute";
import { parseNumberRecordKey, type NumberRecordRef } from "./numberRestrictionsLogic";

/** הטופס שהכתובת מבקשת לפתוח מעל ההיסטוריה. בעריכה - סוג הרשומה והמזהה שלה */
export type NumberRecordFormTarget = FormSheetTarget<NumberRecordRef>;

/** null = הכתובת היא של ההיסטוריה עצמה, ומגירת הטופס סגורה */
export function useNumberRecordFormRoute(): NumberRecordFormTarget | null {
  return useFormSheetRoute({
    createPattern: ROUTE_PATTERNS.newNumberRecord,
    editPattern: ROUTE_PATTERNS.editNumberRecord,
    parseRecordRef: (params) => parseNumberRecordKey(params.recordKey),
  });
}
