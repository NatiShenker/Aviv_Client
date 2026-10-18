import { NavigationType } from "react-router-dom";

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

/**
 * כיוון הכניסה של עמוד חדש לפי סוג הניווט שהביא אליו.
 * REPLACE אינו צעד קדימה או אחורה (למשל חזרה מקישור ישיר), ולכן הוא בלי אנימציה.
 */
export function resolvePageEnterDirection(navigationType: NavigationType, isFirstPage: boolean): PageEnterDirection {
  if (isFirstPage) {
    return "none";
  }

  switch (navigationType) {
    case NavigationType.Push:
      return "forward";
    case NavigationType.Pop:
      return "back";
    case NavigationType.Replace:
      return "none";
  }
}
