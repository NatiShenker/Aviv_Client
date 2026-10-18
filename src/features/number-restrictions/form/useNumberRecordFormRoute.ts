import { ROUTE_PATTERNS } from "@/routes";
import { useFormSheetRoute, type FormSheetTarget } from "@/shells/mobile/navigation/useFormSheetRoute";
import { parseNumberRecordKey, type NumberRecordRef } from "../numberRestrictionsLogic";

/** הטופס שהכתובת מבקשת לפתוח מעל ההיסטוריה. בעריכה (או ביצירה על בסיס רשומה) - סוג הרשומה והמזהה שלה */
export type NumberRecordFormTarget = FormSheetTarget<NumberRecordRef>;

/** null = הכתובת היא של ההיסטוריה עצמה, ומגירת הטופס סגורה */
export function useNumberRecordFormRoute(): NumberRecordFormTarget | null {
  return useFormSheetRoute({
    createPattern: ROUTE_PATTERNS.newNumberRecord,
    editPattern: ROUTE_PATTERNS.editNumberRecord,
    recordParam: "recordKey",
    parseRecordRef: parseNumberRecordKey,
  });
}
