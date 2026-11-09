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
import {
  RESTRICTION_SCOPE_CODE,
  type SourceRestrictionSummaryDto,
  type TraineePhonePermitRecordDto,
  type TraineePhoneRecordDto,
} from "@/types/phone-exceptions.schema";
import { formatDateRange } from "@/utils/dates";
import { isolateLtr, filterBySearchQuery } from "@/utils/text";
import { NUMBER_RESTRICTIONS_TEXTS } from "./numberRestrictionsTexts";

const TEXTS = NUMBER_RESTRICTIONS_TEXTS;

// ── סוג הרשומה וזיהויה ──

/** סוג הרשומה ברשימת המספרים, בשם של הקליינט: נגזר מהדגל isPermit של השרת (C-10) */
export type TraineePhoneRecordType = "restriction" | "permit";

export function recordTypeOf(record: Pick<TraineePhoneRecordDto, "isPermit">): TraineePhoneRecordType {
  return record.isPermit ? "permit" : "restriction";
}

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

/** הסוג והמזהה של רשומה, בלי שאר השדות שלה (למשל לטופס שנפתח עליה) */
export function numberRecordRefOf(record: Pick<TraineePhoneRecordDto, "isPermit" | "id">): NumberRecordRef {
  return { type: recordTypeOf(record), id: record.id };
}

/** המפתח של רשומה בהיסטוריה: הכרטיס הפתוח והרשומה שנשמרה */
export function numberRecordKeyOf(record: Pick<TraineePhoneRecordDto, "isPermit" | "id">): string {
  return buildNumberRecordKey(numberRecordRefOf(record));
}

export function matchesNumberRecordRef(
  record: Pick<TraineePhoneRecordDto, "isPermit" | "id">,
  recordRef: NumberRecordRef,
): boolean {
  return recordTypeOf(record) === recordRef.type && record.id === recordRef.id;
}

const CARD_DOM_ID_PREFIX = "number-record-card-";

/** מזהה ה-DOM של כרטיס, כדי לגלול אליו אחרי שמירה */
export function numberRecordCardDomId(recordKey: string): string {
  return `${CARD_DOM_ID_PREFIX}${recordKey}`;
}

// ── ההגבלה שעליה יושב היתר (ספק 04 overview §2.2, §3) ──

/**
 * היקף ההגבלה כפי שהקליינט מציג אותו (C-9): השרת מחזיר את קוד ה-DECODE ואת הפנימיות, והתווית נגזרת כאן -
 * "national": כללית בלי פנימיות; "institute": כללית המצומצמת לפנימיות; "trainee": הגבלה של החניך
 */
export type PhoneRestrictionScope = "national" | "institute" | "trainee";

type RestrictionScopeFields = Pick<SourceRestrictionSummaryDto, "codeRestrictionScope" | "institutes">;

export function scopeOf({ codeRestrictionScope, institutes }: RestrictionScopeFields): PhoneRestrictionScope {
  if (codeRestrictionScope === RESTRICTION_SCOPE_CODE.trainee) return "trainee";
  return institutes.length > 0 ? "institute" : "national";
}

/** "הגבלה ארצית" / "הגבלת פנימייה – {פנימייה}" / "הגבלה לחניך". כמה פנימיות - מופרדות בפסיק */
export function buildScopeLabel(restriction: RestrictionScopeFields): string {
  switch (scopeOf(restriction)) {
    case "national":
      return TEXTS.scopes.national;
    case "institute": {
      const instituteNames = restriction.institutes
        .map((institute) => institute.name)
        .join(TEXTS.scopes.institutesSeparator);
      return TEXTS.scopes.institute(instituteNames);
    }
    case "trainee":
      return TEXTS.scopes.trainee;
  }
}

/** הפירוט החופשי של הגבלת המקור, או "ללא פירוט" (הסיבה מהרשימה אינה נשמרת - I-23) */
export function buildRestrictionReasonText(restriction: Pick<SourceRestrictionSummaryDto, "textReason">): string {
  return restriction.textReason || TEXTS.card.noReason;
}

/** "חל על הגבלה": "{היקף} · {טווח}". הטווח מבודד כ-LTR, כי הוא חלק ממחרוזת אחת */
export function buildOnRestrictionValue(permit: TraineePhonePermitRecordDto): string {
  const { sourceRestriction } = permit;
  const range = formatDateRange(sourceRestriction.dateStart, sourceRestriction.dateEnd);
  return [buildScopeLabel(sourceRestriction), isolateLtr(range)].join(TEXTS.values.partsSeparator);
}

// ── ערכי התצוגה של רשומה (ספק 04 overview §3, history §3) ──

export function buildNumberRecordDateRange(record: TraineePhoneRecordDto): string {
  return formatDateRange(record.dateStart, record.dateEnd);
}

/** "הגבלה מלאה" / "הגבלת משך שיחה - עד X דק׳", ובהיתר "היתר מלא" / "היתר עם הגבלת משך - עד X דק׳" */
export function buildNumberRecordTypeLabel(record: TraineePhoneRecordDto): string {
  return buildDurationTypeLabel(record.numbDurationLimit, recordTypeOf(record));
}

/**
 * הפרטים בכרטיס פתוח, לפי הסדר בספק 04 history §3.2 (בכל שורה - הפרט הימני ראשון).
 * המספר, תגית הסוג והתאריכים כבר מופיעים בתקציר הכרטיס, ולכן לא חוזרים כאן
 */
export function buildNumberRecordDetails(record: TraineePhoneRecordDto): DetailItem[] {
  const recordType = recordTypeOf(record);
  const details: DetailItem[] = [
    { key: "type", label: TEXTS.details.type, value: buildNumberRecordTypeLabel(record), isFullWidth: true },
  ];

  if (record.isPermit) {
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
      value: buildPermittedHoursValue(record, recordType),
      isLtr: hasPermittedHours(record),
    },
    { key: "devices", label: TEXTS.details.devices, value: buildPermittedDevicesValue(record, recordType) },
    ...buildDecisionDetailItems(record),
  );
  return details;
}

// ── חיפוש ומיון (ספק 04 history §4, ספק 00 §4.1) ──

/** הערכים הגלויים של הרשומה, שהחיפוש בודק */
function buildNumberRecordSearchParts(record: TraineePhoneRecordDto): string[] {
  const recordType = recordTypeOf(record);
  const scopeLabel = record.isPermit ? buildScopeLabel(record.sourceRestriction) : "";
  return [
    record.textPhoneNumber,
    TEXTS.recordTypes[recordType],
    buildNumberRecordTypeLabel(record),
    scopeLabel,
    ...decisionSearchParts(record),
    buildPermittedHoursValue(record, recordType),
    buildPermittedDevicesValue(record, recordType),
    ...buildPermittedDeviceNames(record),
    buildNumberRecordDateRange(record),
    record.dateStart,
    record.dateEnd,
  ];
}

export function filterAndSortNumberRecords(
  records: TraineePhoneRecordDto[],
  searchQuery: string,
  sort: HistorySortOption,
): TraineePhoneRecordDto[] {
  return sortHistoryRecords(filterBySearchQuery(records, searchQuery, buildNumberRecordSearchParts), sort);
}

/**
 * "מוצגים X הגבלות והיתרים" מתחת לחיפוש, לפי הרשומות שמוצגות אחרי החיפוש.
 * רשומה אחת - לפי הסוג שלה: "מוצגת הגבלה אחת" / "מוצג היתר אחד"
 */
export function buildNumberRecordsCountText(visibleRecords: TraineePhoneRecordDto[]): string {
  if (visibleRecords.length === 1) {
    return TEXTS.toolbar.resultsCount.single[recordTypeOf(visibleRecords[0])];
  }
  return TEXTS.toolbar.resultsCount.several(visibleRecords.length);
}
