import type { ISODateString, TimeString } from "@/types/common.schema";

// ── תאריכים בפורמט YYYY-MM-DD ──

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

// ── תצוגה (ספק 00 §5) ──

const DATE_PARTS_SEPARATOR = "-";
const DISPLAY_SEPARATOR = "/";
const SHORT_YEAR_DIGITS = 2;

function splitIsoDate(isoDate: ISODateString): { year: string; month: string; day: string } {
  const [year, month, day] = isoDate.split(DATE_PARTS_SEPARATOR);
  return { year, month, day };
}

/** YYYY-MM-DD → DD/MM/YY (ספק 00 §5) */
export function formatShortDate(isoDate: ISODateString): string {
  const { year, month, day } = splitIsoDate(isoDate);
  return [day, month, year.slice(-SHORT_YEAR_DIGITS)].join(DISPLAY_SEPARATOR);
}

/** YYYY-MM-DD → DD/MM */
export function formatDayMonth(isoDate: ISODateString): string {
  const { month, day } = splitIsoDate(isoDate);
  return [day, month].join(DISPLAY_SEPARATOR);
}

const RANGE_SEPARATOR = "-";

/** טווח תאריכים DD/MM/YY-DD/MM/YY (ספק 00 §5). מוצג LTR, ולכן תאריך ההתחלה משמאל */
export function formatDateRange(startDate: ISODateString, endDate: ISODateString): string {
  return [formatShortDate(startDate), formatShortDate(endDate)].join(RANGE_SEPARATOR);
}

/** טווח שעות HH:mm-HH:mm (ספק 00 §5). מוצג LTR */
export function formatTimeRange(startTime: TimeString, endTime: TimeString): string {
  return [startTime, endTime].join(RANGE_SEPARATOR);
}
