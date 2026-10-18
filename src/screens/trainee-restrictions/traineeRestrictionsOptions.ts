import type { SortDirection } from "@/schemas/trainees.schema";
import { TRAINEE_RESTRICTIONS_TEXTS } from "./traineeRestrictionsTexts";

const SORT_TEXTS = TRAINEE_RESTRICTIONS_TEXTS.sort;

export type RestrictionSortField = "startDate" | "endDate" | "status";

/** אפשרות מיון אחת = שדה + כיוון, בשורה אחת במגירה (ספק 00 §3.25) */
export interface RestrictionSortOption {
  key: string;
  field: RestrictionSortField;
  direction: SortDirection;
  label: string;
}

export const RESTRICTION_SORT_OPTIONS: RestrictionSortOption[] = [
  { key: "start-desc", field: "startDate", direction: "desc", label: SORT_TEXTS.startDateDescending },
  { key: "start-asc", field: "startDate", direction: "asc", label: SORT_TEXTS.startDateAscending },
  { key: "end-desc", field: "endDate", direction: "desc", label: SORT_TEXTS.endDateDescending },
  { key: "end-asc", field: "endDate", direction: "asc", label: SORT_TEXTS.endDateAscending },
  // "יורד" בסטטוס = הפעילות קודם
  { key: "status-desc", field: "status", direction: "desc", label: SORT_TEXTS.statusActiveFirst },
  { key: "status-asc", field: "status", direction: "asc", label: SORT_TEXTS.statusEndedFirst },
];

// ספק 00 §4.1: תאריך התחלה, מהחדש לישן
export const DEFAULT_RESTRICTION_SORT_OPTION = RESTRICTION_SORT_OPTIONS[0];

export function findRestrictionSortOption(key: string): RestrictionSortOption {
  return RESTRICTION_SORT_OPTIONS.find((option) => option.key === key) ?? DEFAULT_RESTRICTION_SORT_OPTION;
}
