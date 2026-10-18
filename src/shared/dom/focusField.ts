const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * מעביר פוקוס לשדה וגולל אליו (למשל לשגיאה הראשונה אחרי שמירה שנכשלה).
 * בפריים הבא, כדי שאזור שנפתח באותו רינדור (כמו אקורדיון) כבר יהיה זמין לפוקוס.
 */
export function focusField(elementId: string): void {
  requestAnimationFrame(() => {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.focus({ preventScroll: true });
    const isReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    element.scrollIntoView({ block: "center", behavior: isReducedMotion ? "auto" : "smooth" });
  });
}
