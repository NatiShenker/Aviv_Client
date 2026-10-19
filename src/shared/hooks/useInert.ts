import { useEffect, type RefObject } from "react";

/**
 * מסמן אלמנט כ-inert (לא זמין למקלדת, לעכבר ולקורא מסך) כל עוד isInert.
 * React 18 לא מעביר את inert כ-prop בוליאני, ולכן הוא נקבע ישירות על האלמנט
 */
export function useInert(elementRef: RefObject<HTMLElement>, isInert: boolean): void {
  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.inert = isInert;
    }
  }, [elementRef, isInert]);
}
