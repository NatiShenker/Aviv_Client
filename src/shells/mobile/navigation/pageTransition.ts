import type { NavigationType } from "react-router-dom";

/** מאיזה צד העמוד נכנס: קדימה (משמאל, RTL), חזרה (מימין), או בלי אנימציה */
export type PageEnterDirection = "forward" | "back" | "none";

// העמוד הראשון שמוצג בטעינת האפליקציה (גם אחרי רענון) נכנס בלי אנימציה
let hasRenderedFirstPage = false;

export function isFirstPageOfSession(): boolean {
  return !hasRenderedFirstPage;
}

/** נקרא אחרי שעמוד הוצג, כדי שהעמודים הבאים כבר ייכנסו עם אנימציה */
export function markPageRendered(): void {
  hasRenderedFirstPage = true;
}

/*
 * כיוון הכניסה לפי סוג הניווט שהביא לעמוד. REPLACE אינו צעד קדימה או אחורה (למשל חזרה מקישור ישיר),
 * ולכן הוא בלי אנימציה. הערכים כתובים כמחרוזות, ולא דרך ה-enum NavigationType של הספרייה: במארח העותק
 * המשותף של react-router-dom לא מייצא אותו כערך, והקריאה אליו הפילה את האפליקציה (לכן מיובא רק הטיפוס)
 */
const ENTER_DIRECTION_BY_NAVIGATION: Record<`${NavigationType}`, PageEnterDirection> = {
  PUSH: "forward",
  POP: "back",
  REPLACE: "none",
};

/** כיוון הכניסה של עמוד חדש לפי סוג הניווט שהביא אליו */
export function resolvePageEnterDirection(navigationType: NavigationType, isFirstPage: boolean): PageEnterDirection {
  if (isFirstPage) {
    return "none";
  }
  return ENTER_DIRECTION_BY_NAVIGATION[navigationType];
}
