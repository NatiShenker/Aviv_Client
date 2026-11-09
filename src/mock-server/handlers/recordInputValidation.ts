import type {
  ApprovalInput,
  ISODateString,
  PermittedCallConditionsInput,
  PhoneString,
  TimeString,
} from "@/types/common.schema";
import { isValidPhone, normalizePhone } from "@/utils/phone";
import { throwValidationError } from "../mockRequest";

/*
 * האימות המבני של בקשות השמירה והקריאה, כמו RequestRules והוולידטורים של הפיצ'רים בשרת (D-18):
 * כל כלל מחזיר את שם השדה שנכשל (בשמות ה-JSON של השרת) או null, והכלל הראשון שנכשל הופך ל-400
 * עם שם השדה וטקסט ריק (C-4) - ההודעות בעברית נשארות בקליינט. ההרכבה של כל בקשה נעשית ב-handler שלה.
 */

/** שם השדה שנכשל, או null כשהכלל עבר */
export type FailedField = string | null;

/** שמות השדות של השרת, כפי שהם חוזרים ב-400 וב-409 (PhoneExceptionsRequestFields / TraineeRestrictionsRequestFields) */
export const SERVER_FIELDS = {
  idntTraineeList: "idntTraineeList",
  idntTrainee: "idntTrainee",
  idntInstitution: "idntInstitution",
  phoneNumberList: "phoneNumberList",
  idntAvivRestrictionNumber: "idntAvivRestrictionNumber",
  idntPrevious: "idntPrevious",
  dateRestrictionStart: "dateRestrictionStart",
  dateRestrictionEnd: "dateRestrictionEnd",
  datePermitStart: "datePermitStart",
  datePermitEnd: "datePermitEnd",
  numbDurationLimit: "numbDurationLimit",
  timePermitStart: "timePermitStart",
  timePermitEnd: "timePermitEnd",
  idntDeviceList: "idntDeviceList",
  textRestrictionReason: "textRestrictionReason",
  textPermitReason: "textPermitReason",
  codeRestrictionReason: "codeRestrictionReason",
  codePermitReason: "codePermitReason",
  idntUserApproval: "idntUserApproval",
  textFile: "textFile",
} as const;

// הגבולות של השרת: RequestRules.DurationMinutesMin / Max, *Limits.DetailsMaxLength, FilePaths.TextFileMaxLength
const DURATION_MINUTES_MIN = 1;
const DURATION_MINUTES_MAX = 120;
export const DETAILS_MAX_LENGTH = 1000;
const TEXT_FILE_MAX_LENGTH = 500;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

// ── כללים בודדים (RequestRules) ──

/** רשימה שאינה ריקה, כולה חיובית (RequireIdList) */
export function requireIdList(ids: number[] | undefined, fieldName: string): FailedField {
  if (!ids || ids.length === 0) return fieldName;
  return distinctPositiveIds(ids, fieldName);
}

/** רשימה שיכולה להיות ריקה (מכשירים: ריק = כל המכשירים), כולה חיובית (DistinctPositiveIds) */
export function distinctPositiveIds(ids: number[] | undefined, fieldName: string): FailedField {
  const hasInvalidId = ids?.some((id) => !Number.isInteger(id) || id <= 0) ?? false;
  return hasInvalidId ? fieldName : null;
}

export function requirePositive(value: number | null | undefined, fieldName: string): FailedField {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? null : fieldName;
}

export function requirePositiveWhenPresent(value: number | null | undefined, fieldName: string): FailedField {
  return value === null || value === undefined ? null : requirePositive(value, fieldName);
}

/** שני התאריכים בפורמט yyyy-MM-dd, והסיום אינו לפני ההתחלה (RequireDateRange; יום הסיום כלול, A-8) */
export function requireDateRange(
  start: ISODateString | undefined,
  end: ISODateString | undefined,
  startFieldName: string,
  endFieldName: string,
): FailedField {
  if (!start || !DATE_PATTERN.test(start)) return startFieldName;
  if (!end || !DATE_PATTERN.test(end)) return endFieldName;
  // תאריכי YYYY-MM-DD מסודרים נכון גם בהשוואת מחרוזות
  return end < start ? endFieldName : null;
}

/** משך ריק (מלא / כל היממה) או מספר שלם בטווח 1–120 (RequireDurationRange) */
export function requireDurationRange(minutes: number | null | undefined, fieldName: string): FailedField {
  if (minutes === null || minutes === undefined) return null;
  const isValid = Number.isInteger(minutes) && minutes >= DURATION_MINUTES_MIN && minutes <= DURATION_MINUTES_MAX;
  return isValid ? null : fieldName;
}

/** שעות: שתיהן ריקות (כל היממה) או שתיהן HH:mm, והסיום אחרי ההתחלה באותו יום (ValidateTimeWindow, OQ-13) */
export function validateTimeWindow(
  start: TimeString | null | undefined,
  end: TimeString | null | undefined,
  startFieldName: string,
  endFieldName: string,
): FailedField {
  if (!start && !end) return null;
  // שעה אחת בלי השנייה: השדה החסר הוא השגוי
  if (!start) return startFieldName;
  if (!end) return endFieldName;
  if (!TIME_PATTERN.test(start)) return startFieldName;
  if (!TIME_PATTERN.test(end)) return endFieldName;
  // שעות HH:mm מסודרות נכון גם בהשוואת מחרוזות
  return end <= start ? endFieldName : null;
}

/** טקסט חובה: לא ריק (רווחים בלבד נחשבים ריק, ספק 00 §4.3) ועד האורך הנתון (RequireText) */
export function requireText(text: string | undefined, maxLength: number, fieldName: string): FailedField {
  const isMissing = !text || text.trim() === "";
  return isMissing || text.length > maxLength ? fieldName : null;
}

/** רשימת מספרים שאינה ריקה, וכל מספר תקין אחרי נרמול (NormalizePhoneNumbers) */
export function requirePhoneNumberList(phoneNumbers: PhoneString[] | undefined): FailedField {
  if (!phoneNumbers || phoneNumbers.length === 0) return SERVER_FIELDS.phoneNumberList;
  const areAllValid = phoneNumbers.every((phoneNumber) => isValidPhone(normalizePhone(phoneNumber)));
  return areAllValid ? null : SERVER_FIELDS.phoneNumberList;
}

/** המספרים כפי שהשרת ממשיך איתם: מנורמלים וללא כפילויות, בסדר הבקשה */
export function normalizeDistinctPhoneNumbers(phoneNumbers: PhoneString[]): PhoneString[] {
  return [...new Set(phoneNumbers.map(normalizePhone))];
}

// ── הרכבות משותפות (ValidateConditions, ValidateApproval) ──

/** תנאי השיחה: משך, שעות ומכשירים */
export function checkConditions(input: PermittedCallConditionsInput): FailedField {
  return (
    requireDurationRange(input.numbDurationLimit, SERVER_FIELDS.numbDurationLimit) ??
    validateTimeWindow(
      input.timePermitStart,
      input.timePermitEnd,
      SERVER_FIELDS.timePermitStart,
      SERVER_FIELDS.timePermitEnd,
    ) ??
    distinctPositiveIds(input.idntDeviceList, SERVER_FIELDS.idntDeviceList)
  );
}

/** הפירוט, קוד הסיבה (I-23), המאשר ונתיב הקובץ (D-13). שמות הפירוט והקוד הם של הפעולה (הגבלה / היתר) */
export function checkApproval(
  details: string | undefined,
  detailsFieldName: string,
  codeReason: number | undefined,
  codeReasonFieldName: string,
  approval: ApprovalInput,
): FailedField {
  return (
    requireText(details, DETAILS_MAX_LENGTH, detailsFieldName) ??
    requirePositive(codeReason, codeReasonFieldName) ??
    checkApproverAndFile(approval)
  );
}

/** המאשר ונתיב הקובץ בלבד - החלק המשותף לכל בקשת שמירה (גם 05, שהסיבה והפירוט שלו בשמות משלו) */
export function checkApproverAndFile(approval: ApprovalInput): FailedField {
  return (
    requirePositive(approval.idntUserApproval, SERVER_FIELDS.idntUserApproval) ??
    requireText(approval.textFile, TEXT_FILE_MAX_LENGTH, SERVER_FIELDS.textFile)
  );
}

/** 400 על הכלל הראשון שנכשל; כלום כשהכל תקין */
export function throwIfInvalid(failedField: FailedField): void {
  if (failedField) {
    throwValidationError(failedField);
  }
}
