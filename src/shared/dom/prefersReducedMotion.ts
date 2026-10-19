const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** האם המשתמש ביקש בהגדרות המערכת להפחית תנועה */
export function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
