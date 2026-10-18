import {
  buildDurationTypeLabel,
  buildPermittedDeviceNames,
  buildPermittedDevicesValue,
  buildPermittedHoursValue,
  hasPermittedHours,
} from "@/features/records/form/callConditionsLogic";
import { sortHistoryRecords, type HistorySortOption } from "@/features/records/history/historySort";
import type { DetailItem } from "@/features/records/history/recordDetails";
import type {
  SourceRestrictionSummaryDto,
  TraineePhonePermitRecordDto,
  TraineePhoneRecordDto,
  TraineePhoneRecordType,
} from "@/schemas/phone-exceptions.schema";
import { isolateLtr } from "@/shared/formatting/bidiText";
import { formatDateRange } from "@/shared/formatting/dateFormat";
import { filterBySearchQuery } from "@/shared/search/searchText";
import { NUMBER_RESTRICTIONS_TEXTS } from "./numberRestrictionsTexts";

const TEXTS = NUMBER_RESTRICTIONS_TEXTS;

// ── זיהוי רשומה ──

/** להגבלות ולהיתרים יש טבלאות נפרדות, ולכן רשומה מזוהה לפי הסוג והמזהה יחד */
export interface NumberRecordRef {
  type: TraineePhoneRecordType;
  id: number;
}

const RECORD_KEY_SEPARATOR = "-";
const RECORD_KEY_PATTERN = /^(restriction|permit)-(\d+)$/;

/** המפתח בכתובת העריכה ובכרטיס הפתוח, למשל "permit-12" */
export function buildNumberRecordKey({ type, id }: NumberRecordRef): string {
  return `${type}${RECORD_KEY_SEPARATOR}${id}`;
}

/** הרשומה מתוך המפתח, או null כשהמפתח לא תקין */
export function parseNumberRecordKey(recordKey: string | undefined): NumberRecordRef | null {
  const match = recordKey ? RECORD_KEY_PATTERN.exec(recordKey) : null;
  if (!match) return null;
  const [, type, id] = match;
  return { type: type as TraineePhoneRecordType, id: Number(id) };
}

export function matchesNumberRecordRef(record: NumberRecordRef, recordRef: NumberRecordRef): boolean {
  return record.type === recordRef.type && record.id === recordRef.id;
}

const CARD_DOM_ID_PREFIX = "number-record-card-";

/** מזהה ה-DOM של כרטיס, כדי לגלול אליו אחרי שמירה */
export function numberRecordCardDomId(recordKey: string): string {
  return `${CARD_DOM_ID_PREFIX}${recordKey}`;
}

// ── ההגבלה שעליה יושב היתר (ספק 04 overview §2.2, §3) ──

type RestrictionScopeFields = Pick<SourceRestrictionSummaryDto, "scope" | "institutes">;

/** "הגבלה ארצית" / "הגבלת פנימייה – {פנימייה}" / "הגבלה לחניך". כמה פנימיות - מופרדות בפסיק */
export function buildScopeLabel({ scope, institutes }: RestrictionScopeFields): string {
  switch (scope) {
    case "national":
      return TEXTS.scopes.national;
    case "institute": {
      const instituteNames = institutes.map((institute) => institute.name).join(TEXTS.scopes.institutesSeparator);
      return TEXTS.scopes.institute(instituteNames);
    }
    case "trainee":
      return TEXTS.scopes.trainee;
  }
}

export function buildRestrictionReasonText(restriction: Pick<SourceRestrictionSummaryDto, "reason">): string {
  return restriction.reason || TEXTS.card.noReason;
}

/** "על הגבלה": "{היקף} · {טווח}". הטווח מבודד כ-LTR, כי הוא חלק ממחרוזת אחת */
export function buildOnRestrictionValue(permit: TraineePhonePermitRecordDto): string {
  const { sourceRestriction } = permit;
  const range = formatDateRange(sourceRestriction.startDate, sourceRestriction.endDate);
  return [buildScopeLabel(sourceRestriction), isolateLtr(range)].join(TEXTS.values.partsSeparator);
}

// ── ערכי התצוגה של רשומה (ספק 04 overview §3, history §3) ──

export function buildNumberRecordDateRange(record: TraineePhoneRecordDto): string {
  return formatDateRange(record.startDate, record.endDate);
}

/** "הגבלה מלאה" / "הגבלת משך שיחה – עד X דק'", ובהיתר "היתר מלא" / "היתר עם הגבלת משך – עד X דק'" */
export function buildNumberRecordTypeLabel(record: TraineePhoneRecordDto): string {
  return buildDurationTypeLabel(record.durationMinutes, record.type);
}

/**
 * הפרטים בכרטיס פתוח, לפי הסדר בספק 04 history §3.2 (בכל שורה - הפרט הימני ראשון).
 * המספר, תגית הסוג והתאריכים כבר מופיעים בתקציר הכרטיס, ולכן לא חוזרים כאן
 */
export function buildNumberRecordDetails(record: TraineePhoneRecordDto): DetailItem[] {
  const details: DetailItem[] = [
    { key: "type", label: TEXTS.details.type, value: buildNumberRecordTypeLabel(record), isFullWidth: true },
  ];

  if (record.type === "permit") {
    details.push({
      key: "onRestriction",
      label: TEXTS.details.onRestriction,
      value: buildOnRestrictionValue(record),
      isFullWidth: true,
    });
  }

  details.push(
    {
      key: "hours",
      label: TEXTS.details.hours,
      value: buildPermittedHoursValue(record, record.type),
      isLtr: hasPermittedHours(record),
    },
    { key: "devices", label: TEXTS.details.devices, value: buildPermittedDevicesValue(record, record.type) },
    { key: "reason", label: TEXTS.details.reason, value: record.reason || TEXTS.details.notSpecified },
    {
      key: "approver",
      label: TEXTS.details.approver,
      value: record.approver.fullName || TEXTS.details.notSpecified,
    },
  );

  if (record.details) {
    details.push({ key: "details", label: TEXTS.details.details, value: record.details, isFullWidth: true });
  }
  return details;
}

// ── חיפוש ומיון (ספק 04 history §4, ספק 00 §4.1) ──

/** הערכים הגלויים של הרשומה, שהחיפוש בודק */
function buildNumberRecordSearchParts(record: TraineePhoneRecordDto): string[] {
  const scopeLabel = record.type === "permit" ? buildScopeLabel(record.sourceRestriction) : "";
  return [
    record.phoneNumber,
    TEXTS.recordTypes[record.type],
    buildNumberRecordTypeLabel(record),
    scopeLabel,
    record.reason,
    record.details,
    record.approver.fullName,
    buildPermittedHoursValue(record, record.type),
    buildPermittedDevicesValue(record, record.type),
    ...buildPermittedDeviceNames(record),
    buildNumberRecordDateRange(record),
    record.startDate,
    record.endDate,
  ];
}

export function filterAndSortNumberRecords(
  records: TraineePhoneRecordDto[],
  searchQuery: string,
  sort: HistorySortOption,
): TraineePhoneRecordDto[] {
  return sortHistoryRecords(filterBySearchQuery(records, searchQuery, buildNumberRecordSearchParts), sort);
}
