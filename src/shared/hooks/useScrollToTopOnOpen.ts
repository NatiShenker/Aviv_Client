import { useLayoutEffect } from "react";

/** גלילה לראש המסך כשהוא נפתח (ספק 00 §4.1). לפני הציור, כדי שהמסך לא יופיע לרגע באמצע */
export function useScrollToTopOnOpen(): void {
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);
}
