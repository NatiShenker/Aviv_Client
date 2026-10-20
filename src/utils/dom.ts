const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** האם המשתמש ביקש בהגדרות המערכת להפחית תנועה */
export function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

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

// סוגי input שמקלידים בהם טקסט חופשי
const TEXT_INPUT_TYPES = ["text", "search", "tel", "email", "number", "url", "password"];

/** האם האלמנט הוא שדה שמקלידים בו (למשל כדי ש-Escape בתוכו יישאר של השדה) */
export function isTextEntryElement(element: Element | null): boolean {
  if (element instanceof HTMLTextAreaElement) {
    return true;
  }
  return element instanceof HTMLInputElement && TEXT_INPUT_TYPES.includes(element.type);
}
