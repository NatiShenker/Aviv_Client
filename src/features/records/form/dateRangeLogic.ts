import type { ISODateString } from "@/types/common.schema";
import { addDaysToIsoDate } from "@/utils/dates";
import { CALL_CONDITIONS_TEXTS } from "./call-conditions/callConditionsTexts";

/*
 * טווח התאריכים, המשותף לכל הרשומות: הגבלות, היתרים והודעות לנמען (ספק 00 §4.2).
 */

export interface DateRangeValues {
  startDate: ISODateString;
  endDate: ISODateString;
}

/** טווח מותר לתאריכים (בהיתר: תקופת ההגבלה שעליה הוא יושב) */
export interface DateBounds {
  min: ISODateString;
  max: ISODateString;
}

/** תאריך שהמשתמש עוד לא שינה מוצג באפור (ספק 00 §4.2) */
export interface TouchedDates {
  startDate: boolean;
  endDate: boolean;
}

const NEXT_DAY_OFFSET = 1;

/** רשומה חדשה: היום עד מחר */
export function createDefaultDateRange(today: ISODateString): DateRangeValues {
  return { startDate: today, endDate: addDaysToIsoDate(today, NEXT_DAY_OFFSET) };
}

/** בעריכה התאריכים מוצגים רגיל; ברשומה חדשה ברירות המחדל באפור עד שהמשתמש משנה אותן */
export function touchedDatesFor(isExistingRecord: boolean): TouchedDates {
  return { startDate: isExistingRecord, endDate: isExistingRecord };
}

export function validateDateRange({ startDate, endDate }: DateRangeValues): string | undefined {
  if (!startDate || !endDate) return CALL_CONDITIONS_TEXTS.validation.datesRequired;
  // תאריכי YYYY-MM-DD מסודרים נכון גם בהשוואת מחרוזות
  if (endDate < startDate) return CALL_CONDITIONS_TEXTS.validation.endBeforeStart;
  return undefined;
}
