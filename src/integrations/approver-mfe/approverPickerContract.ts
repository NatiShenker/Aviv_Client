import type { ApproverRef } from "@/types/common.schema";

/**
 * החוזה של ה-MFE החיצוני לבחירת גורם מאשר: מחזיר את הגורם שנבחר.
 * ה-MFE מוצג בתוך טופס, ולכן נדרש ממנו (הוחלט 2026-10-21):
 * - Enter בשדה החיפוש שלו לא שולח את הטופס שמסביבו;
 * - מעבר בחצים בין התוצאות לא בוחר מיד - הבחירה רק בלחיצה או ב-Enter על תוצאה
 */
export interface ApproverPickerProps {
  onSelect: (approver: ApproverRef) => void;
}
