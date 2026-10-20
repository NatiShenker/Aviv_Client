import type { ISODateString, TemporalStatus } from "@/types/common.schema";
import { addDaysToIsoDate, todayIsoDate } from "@/utils/dates";

// תאריכי המוק מחושבים יחסית להיום, כדי שרשומה "פעילה" תישאר פעילה בכל יום שמריצים את האפליקציה

/** תאריך בהפרש ימים מהיום: שלילי = עבר, חיובי = עתיד */
export function daysFromToday(days: number): ISODateString {
  return addDaysToIsoDate(todayIsoDate(), days);
}

/** תאריך ושעה מלאים (ISO), עבור שדות audit כמו createdAt */
export function dateTimeDaysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/** האם היום נמצא בטווח התאריכים (כולל קצוות). ההשוואה בין מחרוזות YYYY-MM-DD תקינה */
export function isTodayInRange(startDate: ISODateString, endDate: ISODateString): boolean {
  const today = todayIsoDate();
  return startDate <= today && today <= endDate;
}

export function temporalStatusOf(startDate: ISODateString, endDate: ISODateString): TemporalStatus {
  const today = todayIsoDate();
  if (today < startDate) return "scheduled";
  if (today > endDate) return "expired";
  return "active";
}
