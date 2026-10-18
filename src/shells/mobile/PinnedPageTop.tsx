import type { ReactNode } from "react";

interface PinnedPageTopProps {
  children: ReactNode;
}

/**
 * החלק העליון של מסך רשימה (כותרת וכלים): נשאר במקומו, והרשימה נגללת מתחתיו.
 * sticky על גלילת החלון ולא אזור גלילה נפרד, כך ששחזור הגלילה והטעינה ההדרגתית ממשיכים לעבוד כרגיל.
 * כולל את הריווח העליון של המסך, כדי שהכותרת לא תזוז כלל בגלילה.
 */
export default function PinnedPageTop({ children }: PinnedPageTopProps) {
  return <div className="sticky top-0 z-10 bg-background pb-4 pt-12">{children}</div>;
}
