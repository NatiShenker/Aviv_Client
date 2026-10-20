import type { SortDirection } from "@/types/common.schema";
import type {
  BalanceFilter,
  PhoneExceptionFilter,
  RecipientMessageFilter,
  TraineeListFiltersState,
  TraineeRestrictionFilter,
  TraineeSortField,
} from "@/types/trainees.schema";
import { TRAINEES_LIST_TEXTS } from "./traineesListTexts";

export interface FilterOption<TValue extends string> {
  value: TValue;
  label: string;
}

/** הערך הנבחר מתוך האפשרויות, בטיפוס שלהן (הפקד מחזיר ערך כללי) */
export function findOptionValue<TValue extends string>(
  options: FilterOption<TValue>[],
  selectedValue: unknown,
): TValue | undefined {
  return options.find((option) => option.value === selectedValue)?.value;
}

const FILTER_TEXTS = TRAINEES_LIST_TEXTS.filterDrawer;
const SORT_TEXTS = TRAINEES_LIST_TEXTS.sortDrawer.options;

export const DEFAULT_TRAINEE_FILTERS: TraineeListFiltersState = {
  searchQuery: "",
  wingIds: [],
  locationIds: [],
  traineeRestriction: "all",
  recipientMessage: "all",
  phoneException: "all",
  balance: "all",
};

export const TRAINEE_RESTRICTION_FILTER_OPTIONS: FilterOption<TraineeRestrictionFilter>[] = [
  { value: "all", label: FILTER_TEXTS.all },
  { value: "full", label: FILTER_TEXTS.traineeRestriction.full },
  { value: "minutes", label: FILTER_TEXTS.traineeRestriction.minutes },
  { value: "none", label: FILTER_TEXTS.none },
];

export const RECIPIENT_MESSAGE_FILTER_OPTIONS: FilterOption<RecipientMessageFilter>[] = [
  { value: "all", label: FILTER_TEXTS.all },
  { value: "regular", label: FILTER_TEXTS.recipientMessage.regular },
  { value: "interactive", label: FILTER_TEXTS.recipientMessage.interactive },
  { value: "none", label: FILTER_TEXTS.none },
];

export const PHONE_EXCEPTION_FILTER_OPTIONS: FilterOption<PhoneExceptionFilter>[] = [
  { value: "all", label: FILTER_TEXTS.all },
  { value: "restriction", label: FILTER_TEXTS.phoneException.restriction },
  { value: "permit", label: FILTER_TEXTS.phoneException.permit },
  { value: "none", label: FILTER_TEXTS.none },
];

export const BALANCE_FILTER_OPTIONS: FilterOption<BalanceFilter>[] = [
  { value: "all", label: FILTER_TEXTS.all },
  { value: "has_balance", label: FILTER_TEXTS.balance.hasBalance },
  { value: "no_balance", label: FILTER_TEXTS.balance.noBalance },
];

/** אפשרות מיון אחת = שדה + כיוון, בשורה אחת במגירה (למשל "שם – א׳ עד ת׳") */
export interface TraineeSortOption {
  key: string;
  field: TraineeSortField;
  direction: SortDirection;
  label: string;
}

export const TRAINEE_SORT_OPTIONS: TraineeSortOption[] = [
  { key: "name-asc", field: "name", direction: "asc", label: SORT_TEXTS.nameAscending },
  { key: "name-desc", field: "name", direction: "desc", label: SORT_TEXTS.nameDescending },
  // "יורד" בסטטוס = החניכים עם הגבלה קודם
  { key: "status-desc", field: "status", direction: "desc", label: SORT_TEXTS.statusRestrictedFirst },
  { key: "status-asc", field: "status", direction: "asc", label: SORT_TEXTS.statusActiveFirst },
  { key: "minutes-desc", field: "minutes", direction: "desc", label: SORT_TEXTS.minutesDescending },
  { key: "minutes-asc", field: "minutes", direction: "asc", label: SORT_TEXTS.minutesAscending },
  { key: "wing-asc", field: "wing", direction: "asc", label: SORT_TEXTS.wingAscending },
  { key: "wing-desc", field: "wing", direction: "desc", label: SORT_TEXTS.wingDescending },
  { key: "location-asc", field: "location", direction: "asc", label: SORT_TEXTS.locationAscending },
  { key: "location-desc", field: "location", direction: "desc", label: SORT_TEXTS.locationDescending },
];

// ספק 01 §4.1: שם, א׳ עד ת׳
export const DEFAULT_TRAINEE_SORT_OPTION = TRAINEE_SORT_OPTIONS[0];

/** אפשרות מיון כשורה בפקד הבחירה: המפתח שלה והטקסט */
export interface TraineeSortRow {
  value: string;
  label: string;
}

export const TRAINEE_SORT_ROWS: TraineeSortRow[] = TRAINEE_SORT_OPTIONS.map((option) => ({
  value: option.key,
  label: option.label,
}));

export function findSortOption(key: string): TraineeSortOption {
  return TRAINEE_SORT_OPTIONS.find((option) => option.key === key) ?? DEFAULT_TRAINEE_SORT_OPTION;
}
