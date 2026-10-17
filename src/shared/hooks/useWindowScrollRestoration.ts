import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * שחזור הגלילה בחזרה למסך: מדווח על כל שינוי גלילה, ומחזיר אותה פעם אחת למקום השמור
 * ברגע שהתוכן שהיה מוצג נבנה מחדש.
 */
export function useWindowScrollRestoration(
  savedScrollY: number | null,
  isContentReady: boolean,
  onScrollChange: (scrollY: number) => void,
): void {
  const hasRestoredRef = useRef(false);
  const onScrollChangeRef = useRef(onScrollChange);
  onScrollChangeRef.current = onScrollChange;

  // לפני הציור, כדי שהמסך לא יופיע לרגע בראש הדף ואז יקפוץ
  useLayoutEffect(() => {
    if (hasRestoredRef.current || !isContentReady) return;
    hasRestoredRef.current = true;
    if (savedScrollY) {
      window.scrollTo(0, savedScrollY);
    }
  }, [isContentReady, savedScrollY]);

  useEffect(() => {
    const reportScroll = () => onScrollChangeRef.current(window.scrollY);
    window.addEventListener("scroll", reportScroll, { passive: true });
    return () => window.removeEventListener("scroll", reportScroll);
  }, []);
}
