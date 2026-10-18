import type {
  CallLimitKind,
  DecisionApprovalInput,
  ISODateString,
  PermittedCallConditionsInput,
  TimeString,
} from "@/schemas/common.schema";
import type { DeviceDto } from "@/schemas/organization.schema";
import type {
  CreateTraineeRestrictionRequest,
  TraineeRestrictionRecordDto,
  UpdateTraineeRestrictionRequest,
} from "@/schemas/trainee-restrictions.schema";
import type { DecisionValues } from "@/shared/components/form/DecisionBlock";
import { FORM_TEXTS } from "@/shared/components/form/formTexts";
import { addDaysToIsoDate } from "@/shared/dates/isoDate";
import { formatTimeRange } from "@/shared/formatting/dateFormat";
import { isRestrictionOpenByDefault } from "./traineeRestrictionsLogic";
import { TRAINEE_RESTRICTIONS_TEXTS } from "./traineeRestrictionsTexts";

const TEXTS = TRAINEE_RESTRICTIONS_TEXTS;
const VALIDATION_TEXTS = TEXTS.form.validation;

// ── ערכי הטופס ──

/** ערכי הטופס. שדה ריק = מחרוזת ריקה (כמו בפקדים הנייטיביים) */
export interface RestrictionFormValues extends DecisionValues {
  startDate: ISODateString;
  endDate: ISODateString;
  limitKind: CallLimitKind;
  /** מה שהוקלד בשדה המשך. נשמר גם בסוג "הגבלה מלאה", אבל לא נשלח (ספק 00 §3.9) */
  durationText: string;
  startTime: TimeString;
  endTime: TimeString;
  deviceIds: number[];
}

const NEXT_DAY_OFFSET = 1;

/** ערכי פתיחה: הגבלה חדשה (ספק 03 form §4.1) או עריכה של רשומה קיימת */
export function createInitialRestrictionValues(
  record: TraineeRestrictionRecordDto | null,
  today: ISODateString,
): RestrictionFormValues {
  if (!record) {
    return {
      startDate: today,
      endDate: addDaysToIsoDate(today, NEXT_DAY_OFFSET),
      limitKind: "full",
      durationText: "",
      startTime: "",
      endTime: "",
      deviceIds: [],
      // הסיבה נבחרת מרשימה שנטענת מהסרביס
      reasonId: null,
      details: "",
      approver: null,
      approvedFile: null,
    };
  }

  return {
    startDate: record.startDate,
    endDate: record.endDate,
    limitKind: record.durationMinutes === null ? "full" : "limited",
    durationText: record.durationMinutes === null ? "" : String(record.durationMinutes),
    startTime: record.startTime ?? "",
    endTime: record.endTime ?? "",
    deviceIds: record.devices.map((device) => device.id),
    // נמצאת לפי השם כשרשימת הסיבות מגיעה (ראו findReasonIdByName)
    reasonId: null,
    details: record.details,
    approver: record.approver,
    approvedFile: record.approvedFile,
  };
}

/** הרשומה שמורה עם שם הסיבה; המזהה שלה ברשימה נמצא לפי השם (ראו pending-decisions) */
export function findReasonIdByName(reasons: { id: number; name: string }[], reasonName: string): number | null {
  return reasons.find((reason) => reason.name === reasonName)?.id ?? null;
}

// ── שגיאות ──

/** מקומות השגיאה בטופס, לפי סדר ההופעה שלהם מלמעלה למטה */
export const RESTRICTION_ERROR_SLOTS = ["dates", "duration", "hours", "devices", "reason", "approver", "file"] as const;

export type RestrictionErrorSlot = (typeof RESTRICTION_ERROR_SLOTS)[number];

export type RestrictionFormErrors = Partial<Record<RestrictionErrorSlot, string>>;

/** השדה שמקבל פוקוס כשיש שגיאה במקום הזה */
export const RESTRICTION_FIELD_IDS: Record<RestrictionErrorSlot, string> = {
  dates: "restriction-start-date",
  duration: "restriction-duration",
  hours: "restriction-start-time",
  devices: "restriction-devices",
  reason: "restriction-reason",
  approver: "restriction-approver",
  file: "restriction-file",
};

export function findFirstErrorSlot(errors: RestrictionFormErrors): RestrictionErrorSlot | null {
  return RESTRICTION_ERROR_SLOTS.find((slot) => Boolean(errors[slot])) ?? null;
}

export function hasErrors(errors: RestrictionFormErrors): boolean {
  return findFirstErrorSlot(errors) !== null;
}

// ── ולידציה (ספק 03 form §5, ובנוסף סיבה וגורם מאשר חובה - ספק 00 §4.3) ──

const MIN_DURATION_MINUTES = 1;
const MAX_DURATION_MINUTES = 120;
const DIGITS_ONLY = /^\d+$/;

/** כל הכללים רצים יחד, ובכל מקום מוצגת רק השגיאה הראשונה */
export function validateRestrictionForm(values: RestrictionFormValues): RestrictionFormErrors {
  const errors: RestrictionFormErrors = {
    dates: validateDates(values),
    duration: validateDuration(values),
    hours: validateHours(values),
    reason: values.reasonId === null ? FORM_TEXTS.validation.reasonRequired : undefined,
    approver: values.approver === null ? FORM_TEXTS.validation.approverRequired : undefined,
    file: values.approvedFile === null ? FORM_TEXTS.validation.fileRequired : undefined,
  };
  return removeEmptyErrors(errors);
}

function validateDates({ startDate, endDate }: RestrictionFormValues): string | undefined {
  if (!startDate || !endDate) return VALIDATION_TEXTS.datesRequired;
  // תאריכי YYYY-MM-DD מסודרים נכון גם בהשוואת מחרוזות
  if (endDate < startDate) return VALIDATION_TEXTS.endBeforeStart;
  return undefined;
}

function validateDuration({ limitKind, durationText }: RestrictionFormValues): string | undefined {
  if (limitKind !== "limited") return undefined;
  const minutes = Number(durationText);
  const isValid = DIGITS_ONLY.test(durationText) && minutes >= MIN_DURATION_MINUTES && minutes <= MAX_DURATION_MINUTES;
  return isValid ? undefined : VALIDATION_TEXTS.duration;
}

function validateHours({ startTime, endTime }: RestrictionFormValues): string | undefined {
  if (Boolean(startTime) !== Boolean(endTime)) return VALIDATION_TEXTS.hoursRequired;
  // שעות HH:mm מסודרות נכון גם בהשוואת מחרוזות
  if (startTime && endTime <= startTime) return VALIDATION_TEXTS.endTimeBeforeStart;
  return undefined;
}

function removeEmptyErrors(errors: RestrictionFormErrors): RestrictionFormErrors {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => Boolean(message)));
}

// ── שגיאות שרת (400) → מקומות בטופס (ספק 03 form §6.3) ──

const SERVER_FIELD_TO_SLOT: Record<string, RestrictionErrorSlot> = {
  startDate: "dates",
  endDate: "dates",
  durationMinutes: "duration",
  startTime: "hours",
  endTime: "hours",
  deviceIds: "devices",
  reason: "reason",
  reasonCode: "reason",
  approverId: "approver",
  approvedFileId: "file",
};

export function mapServerFieldErrors(fieldErrors: Record<string, string>): RestrictionFormErrors {
  const errors: RestrictionFormErrors = {};
  Object.entries(fieldErrors).forEach(([fieldName, message]) => {
    const slot = SERVER_FIELD_TO_SLOT[fieldName];
    // בכל מקום - השגיאה הראשונה
    if (slot && !errors[slot]) {
      errors[slot] = message;
    }
  });
  return errors;
}

// ── בניית הבקשה (ספק 03 form §4.7, §6.1) ──

/** הטופס כבר עבר ולידציה, ולכן השדות החובה מלאים */
export interface ValidatedDecision {
  reasonId: number;
  reasonName: string;
  approverId: number;
  approvedFileId: number;
}

/** השדות החובה של "סיבות והחלטה", או null אם אחד מהם עדיין ריק */
export function toValidatedDecision(
  values: RestrictionFormValues,
  reasons: { id: number; name: string }[],
): ValidatedDecision | null {
  if (values.reasonId === null || values.approver === null || values.approvedFile === null) {
    return null;
  }
  const reasonName = reasons.find((reason) => reason.id === values.reasonId)?.name ?? "";
  return {
    reasonId: values.reasonId,
    reasonName,
    approverId: values.approver.id,
    approvedFileId: values.approvedFile.id,
  };
}

function toConditionsInput(values: RestrictionFormValues): PermittedCallConditionsInput {
  return {
    // "הגבלה מלאה" נשמרת תמיד בלי משך, גם אם הוקלד ערך
    durationMinutes: values.limitKind === "limited" ? Number(values.durationText) : null,
    startTime: values.startTime || null,
    endTime: values.endTime || null,
    deviceIds: values.deviceIds,
  };
}

function toDecisionInput(values: RestrictionFormValues, decision: ValidatedDecision): DecisionApprovalInput {
  return {
    reason: decision.reasonName,
    reasonCode: decision.reasonId,
    details: values.details,
    approverId: decision.approverId,
    approvedFileId: decision.approvedFileId,
  };
}

export function buildCreateRestrictionRequest(
  values: RestrictionFormValues,
  decision: ValidatedDecision,
  traineeId: number,
): CreateTraineeRestrictionRequest {
  return {
    traineeIds: [traineeId],
    startDate: values.startDate,
    endDate: values.endDate,
    ...toConditionsInput(values),
    ...toDecisionInput(values, decision),
  };
}

export function buildUpdateRestrictionRequest(
  values: RestrictionFormValues,
  decision: ValidatedDecision,
  record: TraineeRestrictionRecordDto,
): UpdateTraineeRestrictionRequest {
  return {
    previousRestrictionId: record.id,
    traineeId: record.traineeId,
    startDate: values.startDate,
    endDate: values.endDate,
    ...toConditionsInput(values),
    ...toDecisionInput(values, decision),
  };
}

// ── תקצירי האקורדיונים (ספק 03 form §4.5) ──

const EMPTY_TIME = TEXTS.form.permitsBlock.timePlaceholder;

function isFormOpenByDefault(values: RestrictionFormValues): boolean {
  return isRestrictionOpenByDefault({
    isDurationLimited: values.limitKind === "limited",
    hasPermittedHours: Boolean(values.startTime && values.endTime),
    permittedDeviceCount: values.deviceIds.length,
  });
}

/** כשמוגדרת לפחות שעה אחת - הטווח (LTR), עם "--:--" לצד החסר. אחרת לפי "פתוחה כברירת מחדל" */
export function buildHoursSummary(values: RestrictionFormValues): { text: string; isTimeRange: boolean } {
  if (values.startTime || values.endTime) {
    return { text: formatTimeRange(values.startTime || EMPTY_TIME, values.endTime || EMPTY_TIME), isTimeRange: true };
  }
  return { text: isFormOpenByDefault(values) ? TEXTS.values.allDay : TEXTS.values.notSet, isTimeRange: false };
}

/** מכשיר אחד - השם שלו; כמה - מספר המכשירים; אף אחד - לפי "פתוחה כברירת מחדל" */
export function buildDevicesSummary(values: RestrictionFormValues, devices: DeviceDto[]): string {
  if (values.deviceIds.length === 0) {
    return isFormOpenByDefault(values) ? TEXTS.values.allDevices : TEXTS.values.notSet;
  }
  const selectedDeviceNames = devices
    .filter((device) => values.deviceIds.includes(device.id))
    .map((device) => device.name);
  // כל עוד רשימת המכשירים לא נטענה, אין שמות - רק מספר המכשירים
  if (selectedDeviceNames.length !== values.deviceIds.length) {
    return TEXTS.form.permitsBlock.devicesCount(values.deviceIds.length);
  }
  return formatDevicesSelection(selectedDeviceNames);
}

/** הטקסט בשדה בחירת המכשירים, ובתקציר (ספק 00 §5) */
export function formatDevicesSelection(selectedDeviceNames: string[]): string {
  if (selectedDeviceNames.length === 1) {
    return selectedDeviceNames[0];
  }
  return TEXTS.form.permitsBlock.devicesCount(selectedDeviceNames.length);
}
