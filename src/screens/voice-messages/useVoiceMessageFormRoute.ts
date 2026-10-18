import { ROUTE_PATTERNS, parseRouteId } from "@/routes";
import { useFormSheetRoute, type FormSheetTarget } from "@/shared/navigation/useFormSheetRoute";

/** הטופס שהכתובת מבקשת לפתוח מעל ההיסטוריה. בעריכה (או ביצירה על בסיס רשומה) - מזהה ההודעה */
export type VoiceMessageFormTarget = FormSheetTarget<number>;

/** null = הכתובת היא של ההיסטוריה עצמה, ומגירת הטופס סגורה */
export function useVoiceMessageFormRoute(): VoiceMessageFormTarget | null {
  return useFormSheetRoute({
    createPattern: ROUTE_PATTERNS.newVoiceMessage,
    editPattern: ROUTE_PATTERNS.editVoiceMessage,
    recordParam: "recordId",
    parseRecordRef: parseRouteId,
  });
}
