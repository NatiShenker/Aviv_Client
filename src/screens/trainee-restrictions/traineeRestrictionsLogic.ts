import type { TraineeRestrictionRecordDto } from "@/schemas/trainee-restrictions.schema";
import type { DetailItem } from "@/shared/components/history/DetailGrid";
import { formatDateRange, formatTimeRange } from "@/shared/formatting/dateFormat";
import type { RestrictionSortField, RestrictionSortOption } from "./traineeRestrictionsOptions";
import { TRAINEE_RESTRICTIONS_TEXTS } from "./traineeRestrictionsTexts";

const TEXTS = TRAINEE_RESTRICTIONS_TEXTS;
const NO_BREAK_SPACE_PATTERN = / /g;
const SPACE = " ";
const SEARCH_TEXT_SEPARATOR = " ";

// ── ערכי התצוגה של רשומה (ספק 03 overview §3) ──

/**
 * "פעילה" כל עוד ההגבלה לא הסתיימה. הגבלה עתידית מוצגת גם היא כפעילה (OQ-01),
 * ולכן רק "expired" נחשבת הסתיימה.
 */
export function isRestrictionActive(record: TraineeRestrictionRecordDto): boolean {
  return record.temporalStatus !== "expired";
}

export function buildRestrictionDateRange(record: TraineeRestrictionRecordDto): string {
  return formatDateRange(record.startDate, record.endDate);
}

export function buildRestrictionTypeLabel(record: TraineeRestrictionRecordDto): string {
  if (record.durationMinutes === null) {
    return TEXTS.values.fullRestriction;
  }
  return TEXTS.values.durationRestriction(record.durationMinutes);
}

function hasPermittedHours(record: TraineeRestrictionRecordDto): boolean {
  return record.startTime !== null && record.endTime !== null;
}

/** מה מוגדר בהגבלה, בלי קשר לאם היא רשומה שמורה או טופס פתוח */
export interface RestrictionPermitsState {
  isDurationLimited: boolean;
  hasPermittedHours: boolean;
  permittedDeviceCount: number;
}

/**
 * "פתוחה כברירת מחדל" (ספק 03 overview §3.2): השיחות מותרות במשהו - הגבלת משך, או היתר שעות, או היתר מכשירים.
 * אחרת הכל חסום, ושדה שלא הוגדר מוצג "לא הוגדרו" במקום "כל היום" / "כל המכשירים".
 * משמש גם את כרטיס ההיסטוריה וגם את התקצירים בטופס.
 */
export function isRestrictionOpenByDefault(permits: RestrictionPermitsState): boolean {
  return permits.isDurationLimited || permits.hasPermittedHours || permits.permittedDeviceCount > 0;
}

function isOpenByDefault(record: TraineeRestrictionRecordDto): boolean {
  return isRestrictionOpenByDefault({
    isDurationLimited: record.durationMinutes !== null,
    hasPermittedHours: hasPermittedHours(record),
    permittedDeviceCount: record.devices.length,
  });
}

export function buildPermittedHoursValue(record: TraineeRestrictionRecordDto): string {
  if (record.startTime !== null && record.endTime !== null) {
    return formatTimeRange(record.startTime, record.endTime);
  }
  return isOpenByDefault(record) ? TEXTS.values.allDay : TEXTS.values.notSet;
}

/** בכרטיס מוצגים כל שמות המכשירים (בטופס - מספר המכשירים) */
export function buildPermittedDevicesValue(record: TraineeRestrictionRecordDto): string {
  if (record.devices.length > 0) {
    return record.devices.map((device) => device.name).join(TEXTS.values.devicesSeparator);
  }
  return isOpenByDefault(record) ? TEXTS.values.allDevices : TEXTS.values.notSet;
}

const CARD_DOM_ID_PREFIX = "restriction-card-";

/** מזהה ה-DOM של כרטיס, כדי לגלול אליו אחרי שמירה */
export function restrictionCardDomId(recordId: number): string {
  return `${CARD_DOM_ID_PREFIX}${recordId}`;
}

export function buildRestrictionReasonSummary(record: TraineeRestrictionRecordDto): string {
  return record.reason || TEXTS.card.noReason;
}

/** הפרטים בכרטיס פתוח, לפי הסדר בספק 03 history §3.2 (בכל שורה - הפרט הימני ראשון) */
export function buildRestrictionDetails(record: TraineeRestrictionRecordDto): DetailItem[] {
  const details: DetailItem[] = [
    { key: "dates", label: TEXTS.details.dates, value: buildRestrictionDateRange(record), isLtr: true },
    { key: "type", label: TEXTS.details.type, value: buildRestrictionTypeLabel(record) },
    {
      key: "hours",
      label: TEXTS.details.hours,
      value: buildPermittedHoursValue(record),
      isLtr: hasPermittedHours(record),
    },
    { key: "devices", label: TEXTS.details.devices, value: buildPermittedDevicesValue(record) },
    { key: "reason", label: TEXTS.details.reason, value: record.reason || TEXTS.details.notSpecified },
    {
      key: "approver",
      label: TEXTS.details.approver,
      value: record.approver.fullName || TEXTS.details.notSpecified,
    },
  ];

  if (record.details) {
    details.push({ key: "details", label: TEXTS.details.details, value: record.details, isFullWidth: true });
  }
  return details;
}

// ── חיפוש ומיון (ספק 03 history §4, ספק 00 §4.1) ──

/** הטקסט שהחיפוש בודק: הערכים הגלויים של הרשומה. רווח קשיח נחשב רווח, כדי ש"עד 10 דק'" יימצא */
function buildRestrictionSearchText(record: TraineeRestrictionRecordDto): string {
  return [
    record.reason,
    record.details,
    record.approver.fullName,
    buildRestrictionTypeLabel(record),
    buildPermittedHoursValue(record),
    buildPermittedDevicesValue(record),
    buildRestrictionDateRange(record),
    record.startDate,
    record.endDate,
  ]
    .join(SEARCH_TEXT_SEPARATOR)
    .replace(NO_BREAK_SPACE_PATTERN, SPACE);
}

function compareRestrictionsBy(
  field: RestrictionSortField,
  first: TraineeRestrictionRecordDto,
  second: TraineeRestrictionRecordDto,
): number {
  // תאריכי YYYY-MM-DD מסודרים נכון גם בהשוואת מחרוזות
  const byStartDate = first.startDate.localeCompare(second.startDate);

  switch (field) {
    case "startDate":
      return byStartDate;
    case "endDate":
      return first.endDate.localeCompare(second.endDate);
    case "status": {
      // בשוויון סטטוס - לפי תאריך ההתחלה
      const byStatus = Number(isRestrictionActive(first)) - Number(isRestrictionActive(second));
      return byStatus !== 0 ? byStatus : byStartDate;
    }
  }
}

export function filterAndSortRestrictions(
  records: TraineeRestrictionRecordDto[],
  searchQuery: string,
  sort: RestrictionSortOption,
): TraineeRestrictionRecordDto[] {
  const trimmedQuery = searchQuery.trim();
  const directionFactor = sort.direction === "asc" ? 1 : -1;

  return records
    .filter((record) => trimmedQuery === "" || buildRestrictionSearchText(record).includes(trimmedQuery))
    .sort((first, second) => directionFactor * compareRestrictionsBy(sort.field, first, second));
}
