import type { SortDirection } from "@/types/common.schema";
import { HISTORY_TEXTS } from "./historyTexts";
import { isRecordActive, type DatedHistoryRecord } from "./recordStatus";

const SORT_TEXTS = HISTORY_TEXTS.sort;

export type HistorySortField = "startDate" | "endDate" | "status";

/** אפשרות מיון אחת = שדה + כיוון, בשורה אחת במגירה (ספק 00 §3.25) */
export interface HistorySortOption {
  key: string;
  field: HistorySortField;
  direction: SortDirection;
}

export const HISTORY_SORT_OPTIONS: HistorySortOption[] = [
  { key: "start-desc", field: "startDate", direction: "desc" },
  { key: "start-asc", field: "startDate", direction: "asc" },
  { key: "end-desc", field: "endDate", direction: "desc" },
  { key: "end-asc", field: "endDate", direction: "asc" },
  // "יורד" בסטטוס = הפעילות תחילה
  { key: "status-desc", field: "status", direction: "desc" },
  { key: "status-asc", field: "status", direction: "asc" },
];

// ספק 00 §4.1: תאריך התחלה, מהחדש לישן
export const DEFAULT_HISTORY_SORT_OPTION = HISTORY_SORT_OPTIONS[0];

/** תוויות מיון הסטטוס, מקובץ הטקסטים של כל פעולה - הן במין של הרשומה ("פעילות" / "פעילים") */
export interface StatusSortTexts {
  activeFirst: string;
  endedFirst: string;
}

/** התווית של אפשרות מיון: תוויות התאריכים משותפות, ותוויות הסטטוס מהפעולה */
export function historySortLabel(option: HistorySortOption, statusSortTexts: StatusSortTexts): string {
  const isDescending = option.direction === "desc";
  switch (option.field) {
    case "startDate":
      return isDescending ? SORT_TEXTS.startDateDescending : SORT_TEXTS.startDateAscending;
    case "endDate":
      return isDescending ? SORT_TEXTS.endDateDescending : SORT_TEXTS.endDateAscending;
    case "status":
      return isDescending ? statusSortTexts.activeFirst : statusSortTexts.endedFirst;
  }
}

/** שורה במגירת המיון: צירוף אחד של שדה וכיוון */
export interface HistorySortRow {
  value: string;
  label: string;
}

export function buildHistorySortRows(statusSortTexts: StatusSortTexts): HistorySortRow[] {
  return HISTORY_SORT_OPTIONS.map((option) => ({
    value: option.key,
    label: historySortLabel(option, statusSortTexts),
  }));
}

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
