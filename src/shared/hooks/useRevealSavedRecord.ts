import { useEffect, useState } from "react";
import { focusField } from "@/shared/dom/focusField";

/**
 * אחרי שמירה ההיסטוריה נטענת מחדש, והכרטיס שנשמר צריך להיראות (ספק 00 §4.1).
 * הגלילה מחכה עד שהכרטיס של הרשומה החדשה מופיע בדף - כלומר עד שהרשימה המעודכנת הגיעה.
 * כרטיס שלא מוצג (למשל בגלל חיפוש פעיל) פשוט לא נגלל אליו.
 * מחזיר פונקציה שמקבלת את מזהה ה-DOM של הכרטיס.
 */
export function useRevealSavedRecord(loadedRecords: unknown): (cardDomId: string) => void {
  const [cardDomIdToReveal, setCardDomIdToReveal] = useState<string | null>(null);

  useEffect(() => {
    if (cardDomIdToReveal === null) return;
    if (!document.getElementById(cardDomIdToReveal)) return;
    setCardDomIdToReveal(null);
    focusField(cardDomIdToReveal);
  }, [cardDomIdToReveal, loadedRecords]);

  return setCardDomIdToReveal;
}
