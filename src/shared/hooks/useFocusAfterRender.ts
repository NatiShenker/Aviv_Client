import { useEffect, useState } from "react";
import { focusField } from "@/shared/dom/focusField";

/**
 * פוקוס וגלילה לשדה אחרי שהמסך התעדכן, ולא באותו רינדור: למשל אחרי ששגיאות הוצגו,
 * אקורדיון שיש בו שגיאה נפתח, או שדה חדש הופיע
 */
export function useFocusAfterRender(): (fieldId: string) => void {
  const [fieldIdToFocus, setFieldIdToFocus] = useState<string | null>(null);

  useEffect(() => {
    if (!fieldIdToFocus) return;
    setFieldIdToFocus(null);
    focusField(fieldIdToFocus);
  }, [fieldIdToFocus]);

  return setFieldIdToFocus;
}
