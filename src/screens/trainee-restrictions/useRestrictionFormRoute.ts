import { useMatch } from "react-router-dom";
import { ROUTE_PATTERNS, parseRouteId } from "@/routes";

/** הטופס שהכתובת מבקשת לפתוח מעל ההיסטוריה */
export type RestrictionFormTarget = { mode: "create" } | { mode: "edit"; recordId: number };

/** null = הכתובת היא של ההיסטוריה עצמה, ומגירת הטופס סגורה */
export function useRestrictionFormRoute(): RestrictionFormTarget | null {
  const createMatch = useMatch(ROUTE_PATTERNS.newTraineeRestriction);
  const editMatch = useMatch(ROUTE_PATTERNS.editTraineeRestriction);

  if (createMatch) {
    return { mode: "create" };
  }

  const recordId = parseRouteId(editMatch?.params.recordId);
  if (recordId !== null) {
    return { mode: "edit", recordId };
  }
  return null;
}
