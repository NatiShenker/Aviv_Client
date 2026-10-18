import type {
  CallLimitKind,
  ISODateString,
  PermittedCallConditionsDto,
  PermittedCallConditionsInput,
  TimeString,
} from "@/schemas/common.schema";
import type { DeviceDto } from "@/schemas/organization.schema";
import { FORM_TEXTS } from "@/shared/components/form/formTexts";
import { addDaysToIsoDate } from "@/shared/dates/isoDate";
import { formatTimeRange } from "@/shared/formatting/dateFormat";
import { CALL_CONDITIONS_TEXTS } from "./callConditionsTexts";

/*
 * תנאי השיחה המשותפים להגבלות ולהיתרים: תאריכים, סוג (מלא / הגבלת משך), שעות ומכשירים מותרים.
 * משמש את טופס החניך (ספק 03) ואת טופס המספר (ספק 04), ואת כרטיסי ההיסטוריה שלהם.
 */

const TEXTS = CALL_CONDITIONS_TEXTS;

/**
 * "restriction" - הגבלה: שדה שלא הוגדר מוצג לפי הכלל "פתוחה כברירת מחדל" (ספק 03 overview §3.2).
 * "permit" - היתר: תמיד פתוח כברירת מחדל, "כל היום" / "כל המכשירים" (ספק 04 overview §3).
 */
export type CallRuleKind = "restriction" | "permit";

// ── ערכי הטופס ──

/** ערכי התנאים בטופס. שדה ריק = מחרוזת ריקה (כמו בפקדים הנייטיביים) */
export interface CallConditionsValues {
  startDate: ISODateString;
  endDate: ISODateString;
  limitKind: CallLimitKind;
  /** מה שהוקלד בשדה המשך. נשמר גם בסוג המלא, אבל לא נשלח (ספק 00 §3.9) */
  durationText: string;
  startTime: TimeString;
  endTime: TimeString;
  deviceIds: number[];
}

export type PermittedCondition = "hours" | "devices";

/** אילו אקורדיונים של התנאים פתוחים */
export type OpenConditions = Record<PermittedCondition, boolean>;

/** תאריך שהמשתמש עוד לא שינה מוצג באפור (ספק 00 §4.2) */
export interface TouchedDates {
  startDate: boolean;
  endDate: boolean;
}

/** רשומה שמורה: תנאי השיחה והתאריכים */
export type DatedCallConditions = PermittedCallConditionsDto & { startDate: ISODateString; endDate: ISODateString };

const NEXT_DAY_OFFSET = 1;

/** רשומה חדשה: היום עד מחר, סוג מלא, בלי שעות ומכשירים (ספק 00 §4.2) */
export function createNewConditionsValues(today: ISODateString): CallConditionsValues {
  return {
    startDate: today,
    endDate: addDaysToIsoDate(today, NEXT_DAY_OFFSET),
    limitKind: "full",
    durationText: "",
    startTime: "",
    endTime: "",
    deviceIds: [],
  };
}

export function conditionsValuesFromRecord(record: DatedCallConditions): CallConditionsValues {
  return {
    startDate: record.startDate,
    endDate: record.endDate,
    limitKind: record.durationMinutes === null ? "full" : "limited",
    durationText: record.durationMinutes === null ? "" : String(record.durationMinutes),
    startTime: record.startTime ?? "",
    endTime: record.endTime ?? "",
    deviceIds: record.devices.map((device) => device.id),
  };
}

export const CLOSED_CONDITIONS: OpenConditions = { hours: false, devices: false };

/** אקורדיון שיש בו ערכים נפתח כשרשומה נפתחת לעריכה (ספק 00 §3.10) */
export function openConditionsForRecord(record: PermittedCallConditionsDto | null): OpenConditions {
  if (!record) return CLOSED_CONDITIONS;
  return {
    hours: Boolean(record.startTime || record.endTime),
    devices: record.devices.length > 0,
  };
}

/** בעריכה התאריכים מוצגים רגיל; ברשומה חדשה ברירות המחדל באפור עד שהמשתמש משנה אותן */
export function touchedDatesFor(isExistingRecord: boolean): TouchedDates {
  return { startDate: isExistingRecord, endDate: isExistingRecord };
}

// ── ולידציה (ספק 03 form §5, ספק 04 form §5) ──

const MIN_DURATION_MINUTES = 1;
const MAX_DURATION_MINUTES = 120;
const DIGITS_ONLY = /^\d+$/;

type DateRangeValues = Pick<CallConditionsValues, "startDate" | "endDate">;
type DurationValues = Pick<CallConditionsValues, "limitKind" | "durationText">;
type HoursValues = Pick<CallConditionsValues, "startTime" | "endTime">;

export function validateDateRange({ startDate, endDate }: DateRangeValues): string | undefined {
  if (!startDate || !endDate) return TEXTS.validation.datesRequired;
  // תאריכי YYYY-MM-DD מסודרים נכון גם בהשוואת מחרוזות
  if (endDate < startDate) return TEXTS.validation.endBeforeStart;
  return undefined;
}

export function validateDuration({ limitKind, durationText }: DurationValues): string | undefined {
  if (limitKind !== "limited") return undefined;
  const minutes = Number(durationText);
  const isValid = DIGITS_ONLY.test(durationText) && minutes >= MIN_DURATION_MINUTES && minutes <= MAX_DURATION_MINUTES;
  return isValid ? undefined : TEXTS.validation.duration;
}

export function validateHours({ startTime, endTime }: HoursValues): string | undefined {
  if (Boolean(startTime) !== Boolean(endTime)) return TEXTS.validation.hoursRequired;
  // שעות HH:mm מסודרות נכון גם בהשוואת מחרוזות
  if (startTime && endTime <= startTime) return TEXTS.validation.endTimeBeforeStart;
  return undefined;
}

// ── בניית הבקשה ──

export function toConditionsInput(values: CallConditionsValues): PermittedCallConditionsInput {
  return {
    // הסוג המלא נשמר תמיד בלי משך, גם אם הוקלד ערך
    durationMinutes: values.limitKind === "limited" ? Number(values.durationText) : null,
    startTime: values.startTime || null,
    endTime: values.endTime || null,
    deviceIds: values.deviceIds,
  };
}

// ── "פתוחה כברירת מחדל" ──

/** מה מוגדר בהגבלה, בלי קשר לאם היא רשומה שמורה או טופס פתוח */
export interface PermittedConditionsState {
  isDurationLimited: boolean;
  hasPermittedHours: boolean;
  permittedDeviceCount: number;
}

/**
 * הגבלה "פתוחה כברירת מחדל" (ספק 03 overview §3.2): השיחות מותרות במשהו - הגבלת משך, או היתר שעות, או היתר מכשירים.
 * אחרת הכל חסום, ושדה שלא הוגדר מוצג "לא הוגדרו" במקום "כל היום" / "כל המכשירים".
 */
export function isRestrictionOpenByDefault(permits: PermittedConditionsState): boolean {
  return permits.isDurationLimited || permits.hasPermittedHours || permits.permittedDeviceCount > 0;
}

function isOpenByDefault(ruleKind: CallRuleKind, permits: PermittedConditionsState): boolean {
  return ruleKind === "permit" || isRestrictionOpenByDefault(permits);
}

// ── תקצירי האקורדיונים בטופס (ספק 03 form §4.5, ספק 04 form §4.9) ──

function formPermitsState(values: CallConditionsValues): PermittedConditionsState {
  return {
    isDurationLimited: values.limitKind === "limited",
    hasPermittedHours: Boolean(values.startTime && values.endTime),
    permittedDeviceCount: values.deviceIds.length,
  };
}

/** כשמוגדרת לפחות שעה אחת - הטווח (LTR), עם "--:--" לצד החסר. אחרת לפי "פתוחה כברירת מחדל" */
export function buildHoursSummary(
  values: CallConditionsValues,
  ruleKind: CallRuleKind,
): { text: string; isTimeRange: boolean } {
  const emptyTime = FORM_TEXTS.conditions.timePlaceholder;
  if (values.startTime || values.endTime) {
    return { text: formatTimeRange(values.startTime || emptyTime, values.endTime || emptyTime), isTimeRange: true };
  }
  const text = isOpenByDefault(ruleKind, formPermitsState(values)) ? TEXTS.values.allDay : TEXTS.values.notSet;
  return { text, isTimeRange: false };
}

/** מכשיר אחד - השם שלו; כמה - מספר המכשירים; אף אחד - לפי "פתוחה כברירת מחדל" */
export function buildDevicesSummary(values: CallConditionsValues, devices: DeviceDto[], ruleKind: CallRuleKind): string {
  if (values.deviceIds.length === 0) {
    return isOpenByDefault(ruleKind, formPermitsState(values)) ? TEXTS.values.allDevices : TEXTS.values.notSet;
  }
  const selectedDeviceNames = devices
    .filter((device) => values.deviceIds.includes(device.id))
    .map((device) => device.name);
  // כל עוד רשימת המכשירים לא נטענה, אין שמות - רק מספר המכשירים
  if (selectedDeviceNames.length !== values.deviceIds.length) {
    return TEXTS.values.devicesCount(values.deviceIds.length);
  }
  return formatDevicesSelection(selectedDeviceNames);
}

/** הטקסט בשדה בחירת המכשירים, בתקציר ובסיכום היתר (ספק 00 §5) */
export function formatDevicesSelection(selectedDeviceNames: string[]): string {
  if (selectedDeviceNames.length === 1) {
    return selectedDeviceNames[0];
  }
  return TEXTS.values.devicesCount(selectedDeviceNames.length);
}

// ── ערכי התצוגה של רשומה שמורה (ספק 03 overview §3, ספק 04 overview §3) ──

export function hasPermittedHours(record: PermittedCallConditionsDto): boolean {
  return record.startTime !== null && record.endTime !== null;
}

function recordPermitsState(record: PermittedCallConditionsDto): PermittedConditionsState {
  return {
    isDurationLimited: record.durationMinutes !== null,
    hasPermittedHours: hasPermittedHours(record),
    permittedDeviceCount: record.devices.length,
  };
}

export function buildPermittedHoursValue(record: PermittedCallConditionsDto, ruleKind: CallRuleKind): string {
  if (record.startTime !== null && record.endTime !== null) {
    return formatTimeRange(record.startTime, record.endTime);
  }
  return isOpenByDefault(ruleKind, recordPermitsState(record)) ? TEXTS.values.allDay : TEXTS.values.notSet;
}

/** מכשיר אחד - השם שלו; כמה - "{n} מכשירים" (יכולים להיות הרבה); אף אחד - לפי "פתוחה כברירת מחדל" */
export function buildPermittedDevicesValue(record: PermittedCallConditionsDto, ruleKind: CallRuleKind): string {
  if (record.devices.length > 0) {
    return formatDevicesSelection(buildPermittedDeviceNames(record));
  }
  return isOpenByDefault(ruleKind, recordPermitsState(record)) ? TEXTS.values.allDevices : TEXTS.values.notSet;
}

/** שמות המכשירים המותרים - גם כשבכרטיס מוצג רק מספרם, החיפוש בהיסטוריה מוצא לפיהם */
export function buildPermittedDeviceNames(record: PermittedCallConditionsDto): string[] {
  return record.devices.map((device) => device.name);
}

/** "הגבלה מלאה" / "הגבלת משך שיחה – עד X דק'", ובהיתר "היתר מלא" / "היתר עם הגבלת משך – עד X דק'" */
export function buildDurationTypeLabel(durationMinutes: number | null, ruleKind: CallRuleKind): string {
  const labels = TEXTS.typeLabels[ruleKind];
  return durationMinutes === null ? labels.full : labels.limited(durationMinutes);
}
