import type { ISODateString, TimeString } from "@/schemas/common.schema";

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
