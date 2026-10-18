import type { ISODateString, TemporalStatus } from "@/schemas/common.schema";
import type { SortDirection } from "@/schemas/trainees.schema";
import type { HistorySortRow } from "./HistorySortDrawer";
import { HISTORY_TEXTS } from "./historyTexts";

const SORT_TEXTS = HISTORY_TEXTS.sort;

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

export type HistorySortField = "startDate" | "endDate" | "status";

/** אפשרות מיון אחת = שדה + כיוון, בשורה אחת במגירה (ספק 00 §3.25) */
export interface HistorySortOption {
  key: string;
  field: HistorySortField;
  direction: SortDirection;
  label: string;
}

export const HISTORY_SORT_OPTIONS: HistorySortOption[] = [
  { key: "start-desc", field: "startDate", direction: "desc", label: SORT_TEXTS.startDateDescending },
  { key: "start-asc", field: "startDate", direction: "asc", label: SORT_TEXTS.startDateAscending },
  { key: "end-desc", field: "endDate", direction: "desc", label: SORT_TEXTS.endDateDescending },
  { key: "end-asc", field: "endDate", direction: "asc", label: SORT_TEXTS.endDateAscending },
  // "יורד" בסטטוס = הפעילות קודם
  { key: "status-desc", field: "status", direction: "desc", label: SORT_TEXTS.statusActiveFirst },
  { key: "status-asc", field: "status", direction: "asc", label: SORT_TEXTS.statusEndedFirst },
];

// ספק 00 §4.1: תאריך התחלה, מהחדש לישן
export const DEFAULT_HISTORY_SORT_OPTION = HISTORY_SORT_OPTIONS[0];

/** השורות של מגירת המיון */
export const HISTORY_SORT_ROWS: HistorySortRow[] = HISTORY_SORT_OPTIONS.map((option) => ({
  value: option.key,
  label: option.label,
}));

export function findHistorySortOption(key: string): HistorySortOption {
  return HISTORY_SORT_OPTIONS.find((option) => option.key === key) ?? DEFAULT_HISTORY_SORT_OPTION;
}

function compareRecordsBy(field: HistorySortField, first: DatedHistoryRecord, second: DatedHistoryRecord): number {
  // תאריכי YYYY-MM-DD מסודרים נכון גם בהשוואת מחרוזות
  const byStartDate = first.startDate.localeCompare(second.startDate);

  switch (field) {
    case "startDate":
      return byStartDate;
    case "endDate":
      return first.endDate.localeCompare(second.endDate);
    case "status": {
      // בשוויון סטטוס - לפי תאריך ההתחלה
      const byStatus = Number(isRecordActive(first)) - Number(isRecordActive(second));
      return byStatus !== 0 ? byStatus : byStartDate;
    }
  }
}

/** עותק ממוין, בלי לשנות את הרשימה שהתקבלה */
export function sortHistoryRecords<TRecord extends DatedHistoryRecord>(
  records: TRecord[],
  sort: HistorySortOption,
): TRecord[] {
  const directionFactor = sort.direction === "asc" ? 1 : -1;
  return [...records].sort((first, second) => directionFactor * compareRecordsBy(sort.field, first, second));
}
