import type { ISODateString, TemporalStatus } from "@/schemas/common.schema";

// תאריכי המוק מחושבים יחסית להיום, כדי שרשומה "פעילה" תישאר פעילה בכל יום שמריצים את האפליקציה

const DATE_PART_DIGITS = 2;

// לפי השעון המקומי ולא UTC, אחרת סביב חצות "היום" זז ביום
function toIsoDate(date: Date): ISODateString {
  const year = date.getFullYear();
  // getMonth מתחיל מ-0
  const month = String(date.getMonth() + 1).padStart(DATE_PART_DIGITS, "0");
  const day = String(date.getDate()).padStart(DATE_PART_DIGITS, "0");
  return `${year}-${month}-${day}`;
}

export function todayIsoDate(): ISODateString {
  return toIsoDate(new Date());
}

/** תאריך בהפרש ימים מהיום: שלילי = עבר, חיובי = עתיד */
export function daysFromToday(days: number): ISODateString {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
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
