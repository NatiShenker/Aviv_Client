import type { ISODateString } from "@/types/common.schema";

/** רשומה בהיסטוריה: מספיקים התאריכים והדגל כדי למיין אותה ולקבוע את הסטטוס שלה */
export interface DatedHistoryRecord {
  dateStart: ISODateString;
  dateEnd: ISODateString;
  /** מהשרת, לפי השעון שלו (I-19) */
  isEnded: boolean;
}

/**
 * פעילה כל עוד הרשומה לא הסתיימה. רשומה עתידית מוצגת גם היא כפעילה (OQ-01),
 * ולכן הדגל היחיד הוא isEnded (C-11).
 */
export function isRecordActive(record: Pick<DatedHistoryRecord, "isEnded">): boolean {
  return !record.isEnded;
}
