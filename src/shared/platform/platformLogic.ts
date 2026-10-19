import { DESKTOP_LAYOUT_MIN_WIDTH_PX } from "./platformConstants";

export type AppLayout = "mobile" | "desktop";

/** הפריסה נקבעת לפי רוחב המכולה של אביב, ולא לפי רוחב החלון (במארח יש סרגלים משלו) */
export function resolveLayout(containerWidthPx: number): AppLayout {
  return containerWidthPx >= DESKTOP_LAYOUT_MIN_WIDTH_PX ? "desktop" : "mobile";
}
