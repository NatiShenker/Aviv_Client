import { useLayoutEffect, useRef, type ReactNode } from "react";

// פתיחה וסגירה באותו משך (ספק 00 §2.4, "Card expand"). בהעדפת "הפחתת תנועה" - בלי אנימציה
export const COLLAPSIBLE_MOTION_CLASS = "motion-safe:duration-300 motion-safe:ease-out";

interface CollapsibleProps {
  isOpen: boolean;
  children: ReactNode;
  id?: string;
}

/**
 * תוכן נפתח: הגובה גדל מ-0 לגובה התוכן (מעבר בין 0fr ל-1fr בשורת grid, בלי למדוד גובה),
 * והתוכן מופיע בדהייה ובתזוזה קלה למטה. בסגירה - הכל בכיוון ההפוך.
 * ריווח בין הכותרת לתוכן שייך לתוכן עצמו, כדי שבמצב סגור הגובה יהיה 0.
 */
export default function Collapsible({ isOpen, children, id }: CollapsibleProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // תוכן סגור נשאר בדף (כדי שהסגירה תונפש), ולכן הוא מוסתר מקורא מסך ומהמקלדת.
  // לפני הציור, כדי שתוכן שנפתח יהיה זמין לפוקוס מיד (למשל שדה עם שגיאה)
  useLayoutEffect(() => {
    if (contentRef.current) {
      contentRef.current.inert = !isOpen;
    }
  }, [isOpen]);

  const rowsClass = isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]";
  const revealClass = isOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0";

  return (
    <div
      ref={contentRef}
      id={id}
      className={`grid motion-safe:transition-[grid-template-rows] ${COLLAPSIBLE_MOTION_CLASS} ${rowsClass}`}
    >
      <div className="min-h-0 overflow-hidden">
        <div className={`motion-safe:transition ${COLLAPSIBLE_MOTION_CLASS} ${revealClass}`}>{children}</div>
      </div>
    </div>
  );
}
