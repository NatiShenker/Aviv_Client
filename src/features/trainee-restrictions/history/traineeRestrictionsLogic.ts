import type { DeviceNameResolver } from "@/features/records/deviceNames";
import {
  buildDurationTypeLabel,
  buildPermittedDeviceNames,
  buildPermittedDevicesValue,
  buildPermittedHoursValue,
  hasPermittedHours,
} from "@/features/records/form/call-conditions/callConditionsLogic";
import {
  buildDecisionDetailItems,
  decisionSearchParts,
  type DetailItem,
} from "@/features/records/history/card/recordDetails";
import { sortHistoryRecords, type HistorySortOption } from "@/features/records/history/historySort";
import type { TraineeRestrictionRecordDto } from "@/types/trainee-restrictions.schema";
import { formatDateRange } from "@/utils/dates";
import { filterBySearchQuery } from "@/utils/text";
import { TRAINEE_RESTRICTIONS_TEXTS } from "../traineeRestrictionsTexts";

const TEXTS = TRAINEE_RESTRICTIONS_TEXTS;
// כל הרשומות במסך הזה הן הגבלות (ספק 03 overview §3.2)
const RULE_KIND = "restriction";

// ── זיהוי רשומה ──

/** המפתח של רשומה בהיסטוריה: הכרטיס הפתוח והרשומה שנשמרה */
export function traineeRestrictionRecordKey(record: TraineeRestrictionRecordDto): number {
  return record.id;
}

/** הרשומה שהטופס נפתח עליה (בעריכה או ביצירה על בסיס רשומה) */
export function matchesTraineeRestrictionId(record: TraineeRestrictionRecordDto, recordId: number): boolean {
  return record.id === recordId;
}

// ── ערכי התצוגה של רשומה (ספק 03 overview §3) ──

export function buildTraineeRestrictionDateRange(record: TraineeRestrictionRecordDto): string {
  return formatDateRange(record.dateStart, record.dateEnd);
}

export function buildTraineeRestrictionTypeLabel(record: TraineeRestrictionRecordDto): string {
  return buildDurationTypeLabel(record.numbDurationLimit, RULE_KIND);
}

const CARD_DOM_ID_PREFIX = "restriction-card-";

/** מזהה ה-DOM של כרטיס, כדי לגלול אליו אחרי שמירה */
export function traineeRestrictionCardDomId(recordId: number): string {
  return `${CARD_DOM_ID_PREFIX}${recordId}`;
}

/**
 * הפרטים בכרטיס פתוח, לפי הסדר בספק 03 history §3.2 (בכל שורה - הפרט הימני ראשון).
 * הסוג והתאריכים כבר מופיעים בתקציר הכרטיס, ולכן לא חוזרים כאן. שמות המכשירים - מרשימת מכשירי הפנימייה (E-8)
 */
export function buildTraineeRestrictionDetails(
  record: TraineeRestrictionRecordDto,
  deviceNameOf: DeviceNameResolver,
): DetailItem[] {
  return [
    {
      key: "hours",
      label: TEXTS.details.hours,
      value: buildPermittedHoursValue(record, RULE_KIND),
      isLtr: hasPermittedHours(record),
    },
    { key: "devices", label: TEXTS.details.devices, value: buildPermittedDevicesValue(record, RULE_KIND, deviceNameOf) },
    ...buildDecisionDetailItems(record),
  ];
}

// ── חיפוש ומיון (ספק 03 history §4, ספק 00 §4.1) ──

/** הערכים הגלויים של הרשומה, שהחיפוש בודק */
function buildTraineeRestrictionSearchParts(
  record: TraineeRestrictionRecordDto,
  deviceNameOf: DeviceNameResolver,
): string[] {
  return [
    ...decisionSearchParts(record),
    buildTraineeRestrictionTypeLabel(record),
    buildPermittedHoursValue(record, RULE_KIND),
    buildPermittedDevicesValue(record, RULE_KIND, deviceNameOf),
    ...buildPermittedDeviceNames(record, deviceNameOf),
    buildTraineeRestrictionDateRange(record),
    record.dateStart,
    record.dateEnd,
  ];
}

export function filterAndSortTraineeRestrictions(
  records: TraineeRestrictionRecordDto[],
  searchQuery: string,
  sort: HistorySortOption,
  deviceNameOf: DeviceNameResolver,
): TraineeRestrictionRecordDto[] {
  const searchPartsOf = (record: TraineeRestrictionRecordDto) => buildTraineeRestrictionSearchParts(record, deviceNameOf);
  return sortHistoryRecords(filterBySearchQuery(records, searchQuery, searchPartsOf), sort);
}

/** "מוצגות X הגבלות" מתחת לחיפוש, לפי הרשומות שמוצגות אחרי החיפוש */
export function buildTraineeRestrictionsCountText(visibleRecords: TraineeRestrictionRecordDto[]): string {
  return TEXTS.toolbar.resultsCount(visibleRecords.length);
}
