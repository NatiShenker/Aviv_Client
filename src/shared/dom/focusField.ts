import { prefersReducedMotion } from "./prefersReducedMotion";

/**
 * מעביר פוקוס לשדה וגולל אליו (למשל לשגיאה הראשונה אחרי שמירה שנכשלה).
 * בפריים הבא, כדי שאזור שנפתח באותו רינדור (כמו אקורדיון) כבר יהיה זמין לפוקוס.
 */
export function focusField(elementId: string): void {
  requestAnimationFrame(() => {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.focus({ preventScroll: true });
    element.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  });
}
