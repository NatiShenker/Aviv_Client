import { useCallback } from "react";
import { TOAST_TYPES, useToast } from "ui-library";
import { useLiveAnnouncer } from "@/shared/components/LiveAnnouncer";

/**
 * הודעה קצרה אחרי שמירה מוצלחת של רשומה (ספק 00 §4.2). הרשומה שנשמרה עדיין נפתחת ברשימה;
 * ההודעה מאשרת את השמירה גם כשחיפוש פעיל מסתיר את הכרטיס שלה.
 * בתוך מגירה מודאלית קורא המסך לא שומע את הטוסט, ולכן ההודעה מוכרזת גם במגירה עצמה
 */
export function useSaveSuccessToast(): (message: string) => void {
  const addToast = useToast();
  const announce = useLiveAnnouncer();

  return useCallback(
    (message: string) => {
      addToast(TOAST_TYPES.SUCCESS, message);
      announce?.(message);
    },
    [addToast, announce],
  );
}
