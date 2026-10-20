import { useCallback } from "react";
import { TOAST_TYPES, useToast } from "ui-library";

/**
 * הודעה קצרה אחרי שמירה מוצלחת של רשומה (ספק 00 §4.2). הרשומה שנשמרה עדיין נפתחת ברשימה;
 * ההודעה מאשרת את השמירה גם כשחיפוש פעיל מסתיר את הכרטיס שלה
 */
export function useSaveSuccessToast(): (message: string) => void {
  const addToast = useToast();
  return useCallback((message: string) => addToast(TOAST_TYPES.SUCCESS, message), [addToast]);
}
