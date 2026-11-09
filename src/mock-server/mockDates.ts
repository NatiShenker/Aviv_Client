import type { ISODateString } from "@/types/common.schema";
import { addDaysToIsoDate, todayIsoDate } from "@/utils/dates";

// תאריכי המוק מחושבים יחסית להיום, כדי שרשומה "פעילה" תישאר פעילה בכל יום שמריצים את האפליקציה

/** תאריך בהפרש ימים מהיום: שלילי = עבר, חיובי = עתיד */
export function daysFromToday(days: number): ISODateString {
  return addDaysToIsoDate(todayIsoDate(), days);
}

const TIME_PART_DIGITS = 2;
const TIME_PARTS_SEPARATOR = ":";
const DATE_TIME_SEPARATOR = "T";

/** חותמת זמן בהפרש ימים מהיום, בפורמט של השרת: yyyy-MM-ddTHH:mm:ss בזמן מקומי, בלי אזור זמן (I-18) */
export function dateTimeDaysFromToday(days: number): string {
  const now = new Date();
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((part) => String(part).padStart(TIME_PART_DIGITS, "0"))
    .join(TIME_PARTS_SEPARATOR);
  return `${daysFromToday(days)}${DATE_TIME_SEPARATOR}${time}`;
}

/** האם היום נמצא בטווח התאריכים (כולל קצוות). ההשוואה בין מחרוזות YYYY-MM-DD תקינה */
export function isTodayInRange(startDate: ISODateString, endDate: ISODateString): boolean {
  const today = todayIsoDate();
  return startDate <= today && today <= endDate;
}

/** הרשומה הסתיימה: יום הסיום לפני היום (יום הסיום כלול), כמו IsEnded בפרוצדורות (I-19, A-8) */
export function hasEnded(endDate: ISODateString): boolean {
  return endDate < todayIsoDate();
}
