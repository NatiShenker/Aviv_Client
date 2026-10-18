import { ROUTE_PATTERNS, parseRouteId } from "@/routes";
import { useFormSheetRoute, type FormSheetTarget } from "@/shared/navigation/useFormSheetRoute";

/** הטופס שהכתובת מבקשת לפתוח מעל ההיסטוריה. בעריכה - מזהה ההגבלה */
export type RestrictionFormTarget = FormSheetTarget<number>;

/** null = הכתובת היא של ההיסטוריה עצמה, ומגירת הטופס סגורה */
export function useRestrictionFormRoute(): RestrictionFormTarget | null {
  return useFormSheetRoute({
    createPattern: ROUTE_PATTERNS.newTraineeRestriction,
    editPattern: ROUTE_PATTERNS.editTraineeRestriction,
    parseRecordRef: (params) => parseRouteId(params.recordId),
  });
}
