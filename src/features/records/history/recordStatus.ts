import type { ISODateString, TemporalStatus } from "@/types/common.schema";

/** רשומה בהיסטוריה: מספיקים התאריכים והסטטוס כדי למיין אותה */
export interface DatedHistoryRecord {
  startDate: ISODateString;
  endDate: ISODateString;
  temporalStatus: TemporalStatus;
}

/**
 * פעילה כל עוד הרשומה לא הסתיימה. רשומה עתידית מוצגת גם היא כפעילה (OQ-01),
 * ולכן רק "expired" נחשבת הסתיימה.
 */
export function isRecordActive(record: Pick<DatedHistoryRecord, "temporalStatus">): boolean {
  return record.temporalStatus !== "expired";
}
