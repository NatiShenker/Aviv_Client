import type { RecordFormTarget } from "@/features/records/form/formStartingPoint";
import { useRecordFormRoute } from "@/features/records/form/useRecordFormRoute";
import { ROUTE_PATTERNS, parseRouteId } from "@/routes";

/** הטופס שהכתובת מבקשת לפתוח מעל ההיסטוריה. בעריכה (או ביצירה על בסיס רשומה) - מזהה ההודעה */
export type VoiceMessageFormTarget = RecordFormTarget<number>;

/** null = הכתובת היא של ההיסטוריה עצמה, ומגירת הטופס סגורה */
export function useVoiceMessageFormRoute(): VoiceMessageFormTarget | null {
  return useRecordFormRoute({
    createPattern: ROUTE_PATTERNS.newVoiceMessage,
    editPattern: ROUTE_PATTERNS.editVoiceMessage,
    recordParam: "recordId",
    parseRecordRef: parseRouteId,
  });
}
