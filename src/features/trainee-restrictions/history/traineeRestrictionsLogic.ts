import {
  buildDurationTypeLabel,
  buildPermittedDeviceNames,
  buildPermittedDevicesValue,
  buildPermittedHoursValue,
  hasPermittedHours,
} from "@/features/records/form/callConditionsLogic";
import { sortHistoryRecords, type HistorySortOption } from "@/features/records/history/historySort";
import {
  buildDecisionDetailItems,
  decisionSearchParts,
  type DetailItem,
} from "@/features/records/history/recordDetails";
import type { TraineeRestrictionRecordDto } from "@/schemas/trainee-restrictions.schema";
import { formatDateRange } from "@/shared/formatting/dateFormat";
import { filterBySearchQuery } from "@/shared/search/searchText";
import { TRAINEE_RESTRICTIONS_TEXTS } from "../traineeRestrictionsTexts";

const TEXTS = TRAINEE_RESTRICTIONS_TEXTS;
// כל הרשומות במסך הזה הן הגבלות (ספק 03 overview §3.2)
const RULE_KIND = "restriction";

// ── ערכי התצוגה של רשומה (ספק 03 overview §3) ──

export function buildRestrictionDateRange(record: TraineeRestrictionRecordDto): string {
  return formatDateRange(record.startDate, record.endDate);
}

export function buildRestrictionTypeLabel(record: TraineeRestrictionRecordDto): string {
  return buildDurationTypeLabel(record.durationMinutes, RULE_KIND);
}

const CARD_DOM_ID_PREFIX = "restriction-card-";

/** מזהה ה-DOM של כרטיס, כדי לגלול אליו אחרי שמירה */
export function restrictionCardDomId(recordId: number): string {
  return `${CARD_DOM_ID_PREFIX}${recordId}`;
}

/**
 * הפרטים בכרטיס פתוח, לפי הסדר בספק 03 history §3.2 (בכל שורה - הפרט הימני ראשון).
 * הסוג והתאריכים כבר מופיעים בתקציר הכרטיס, ולכן לא חוזרים כאן
 */
export function buildRestrictionDetails(record: TraineeRestrictionRecordDto): DetailItem[] {
  return [
    {
      key: "hours",
      label: TEXTS.details.hours,
      value: buildPermittedHoursValue(record, RULE_KIND),
      isLtr: hasPermittedHours(record),
    },
    { key: "devices", label: TEXTS.details.devices, value: buildPermittedDevicesValue(record, RULE_KIND) },
    ...buildDecisionDetailItems(record),
  ];
}

// ── חיפוש ומיון (ספק 03 history §4, ספק 00 §4.1) ──

/** הערכים הגלויים של הרשומה, שהחיפוש בודק */
function buildRestrictionSearchParts(record: TraineeRestrictionRecordDto): string[] {
  return [
    ...decisionSearchParts(record),
    buildRestrictionTypeLabel(record),
    buildPermittedHoursValue(record, RULE_KIND),
    buildPermittedDevicesValue(record, RULE_KIND),
    ...buildPermittedDeviceNames(record),
    buildRestrictionDateRange(record),
    record.startDate,
    record.endDate,
  ];
}

export function filterAndSortRestrictions(
  records: TraineeRestrictionRecordDto[],
  searchQuery: string,
  sort: HistorySortOption,
): TraineeRestrictionRecordDto[] {
  return sortHistoryRecords(filterBySearchQuery(records, searchQuery, buildRestrictionSearchParts), sort);
}
