import type { RecordFormTarget } from "@/features/records/form/formStartingPoint";
import { useRecordFormRoute } from "@/features/records/form/useRecordFormRoute";
import { ROUTE_PATTERNS, parseRouteId } from "@/routes";

/** הטופס שהכתובת מבקשת לפתוח מעל ההיסטוריה. בעריכה (או ביצירה על בסיס רשומה) - מזהה ההגבלה */
export type RestrictionFormTarget = RecordFormTarget<number>;

/** null = הכתובת היא של ההיסטוריה עצמה, ומגירת הטופס סגורה */
export function useRestrictionFormRoute(): RestrictionFormTarget | null {
  return useRecordFormRoute({
    createPattern: ROUTE_PATTERNS.newTraineeRestriction,
    editPattern: ROUTE_PATTERNS.editTraineeRestriction,
    recordParam: "recordId",
    parseRecordRef: parseRouteId,
  });
}
