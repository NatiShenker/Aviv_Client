import { useEffect, useState } from "react";
import { focusField } from "@/shared/dom/focusField";
import { restrictionCardDomId } from "./traineeRestrictionsLogic";

/**
 * אחרי שמירה ההיסטוריה נטענת מחדש, והכרטיס שנשמר צריך להיראות (ספק 00 §4.1).
 * הגלילה מחכה עד שהכרטיס של הרשומה החדשה מופיע בדף - כלומר עד שהרשימה המעודכנת הגיעה.
 * כרטיס שלא מוצג (למשל בגלל חיפוש פעיל) פשוט לא נגלל אליו.
 */
export function useRevealSavedRecord(loadedRecords: unknown): (recordId: number) => void {
  const [recordIdToReveal, setRecordIdToReveal] = useState<number | null>(null);

  useEffect(() => {
    if (recordIdToReveal === null) return;
    const cardDomId = restrictionCardDomId(recordIdToReveal);
    if (!document.getElementById(cardDomId)) return;
    setRecordIdToReveal(null);
    focusField(cardDomId);
  }, [recordIdToReveal, loadedRecords]);

  return setRecordIdToReveal;
}
