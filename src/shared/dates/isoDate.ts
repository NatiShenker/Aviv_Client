import type { ISODateString } from "@/schemas/common.schema";

const DATE_PART_DIGITS = 2;

// לפי השעון המקומי ולא UTC, אחרת סביב חצות "היום" זז ביום
function toIsoDate(date: Date): ISODateString {
  const year = date.getFullYear();
  // getMonth מתחיל מ-0
  const month = String(date.getMonth() + 1).padStart(DATE_PART_DIGITS, "0");
  const day = String(date.getDate()).padStart(DATE_PART_DIGITS, "0");
  return `${year}-${month}-${day}`;
}

/** התאריך של היום, YYYY-MM-DD */
export function todayIsoDate(): ISODateString {
  return toIsoDate(new Date());
}

/** תאריך YYYY-MM-DD בהפרש ימים מתאריך אחר (שלילי = לפני) */
export function addDaysToIsoDate(isoDate: ISODateString, days: number): ISODateString {
  const [year, month, day] = isoDate.split("-").map(Number);
  // getMonth מתחיל מ-0
  return toIsoDate(new Date(year, month - 1, day + days));
}
