import { format, isValid, parseISO } from "date-fns";
import moment, { type Moment } from "moment";

/*
 * ההמרות בין ערכי הטופס (מחרוזות) לערכים של פקדי התאריך והשעה של הספרייה - במקום אחד.
 * הטופס עובד עם 'YYYY-MM-DD' ו-'HH:mm'; IpsDatePicker עם Date, ו-IpsTimePicker עם Moment.
 */

const ISO_DATE_FORMAT = "yyyy-MM-dd";
const TIME_VALUE_FORMAT = "HH:mm";

/** 'YYYY-MM-DD' → Date בשעון המקומי, או null כשאין תאריך */
export function isoDateToDate(isoDate: string): Date | null {
  if (!isoDate) return null;
  const date = parseISO(isoDate);
  return isValid(date) ? date : null;
}

/** Date → 'YYYY-MM-DD'. בלי תאריך, או תאריך חלקי שעוד מוקלד → '' */
export function dateToIsoDate(date: Date | null): string {
  return date && isValid(date) ? format(date, ISO_DATE_FORMAT) : "";
}

/** 'HH:mm' → Moment, או null כשאין שעה */
export function timeToMoment(time: string): Moment | null {
  if (!time) return null;
  const parsedTime = moment(time, TIME_VALUE_FORMAT, true);
  return parsedTime.isValid() ? parsedTime : null;
}

/** Moment → 'HH:mm'. בלי שעה, או שעה חלקית שעוד מוקלדת → '' */
export function momentToTime(time: Moment | null): string {
  return time && time.isValid() ? time.format(TIME_VALUE_FORMAT) : "";
}
