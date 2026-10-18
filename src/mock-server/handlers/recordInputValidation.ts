import { HTTP_STATUS } from "@/infrastructure/http/httpStatus";
import type { DecisionApprovalInput, ISODateString, PermittedCallConditionsInput } from "@/schemas/common.schema";
import { APPROVED_FILES_MOCK_DATA } from "../data/approvedFilesMockData";
import { APPROVERS_MOCK_DATA } from "../data/approversMockData";
import { MockHandlerError } from "../mockRequest";

// ── ולידציה משותפת להגבלות ולהיתרים: השרת חוזר על כל כללי הטופס (ספק 00 §7, ספק 03-04 form §5) ──

/** השדות המשותפים לכל בקשות השמירה של הגבלות והיתרים */
export type ConditionsAndDecisionInput = PermittedCallConditionsInput &
  DecisionApprovalInput & { startDate: ISODateString; endDate: ISODateString };

export interface InputValidationRules {
  /** חובה בהגבלת חניך; לא חובה בהגבלה/היתר למספר (ספק 00 §4.3) */
  isReasonRequired: boolean;
}

const MIN_DURATION_MINUTES = 1;
const MAX_DURATION_MINUTES = 120;

export const VALIDATION_MESSAGES = {
  datesRequired: "יש לבחור תאריך התחלה ותאריך סיום",
  endBeforeStart: "תאריך הסיום לא יכול להיות לפני תאריך ההתחלה",
  duration: "יש להזין מספר דקות שלם בין 1 ל-120",
  hoursRequired: "יש לבחור שעת התחלה ושעת סיום",
  endTimeBeforeStart: "שעת הסיום חייבת להיות אחרי שעת ההתחלה",
  reasonRequired: "יש לבחור סיבה",
  detailsRequired: "יש להזין פירוט",
  approverRequired: "יש לבחור גורם מאשר",
  fileRequired: "יש לצרף קובץ",
} as const;

/** השגיאות לפי שם השדה בבקשה. אובייקט ריק = הבקשה תקינה */
export function validateConditionsAndDecision(
  input: ConditionsAndDecisionInput,
  { isReasonRequired }: InputValidationRules,
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (!input.startDate || !input.endDate) {
    fieldErrors.startDate = VALIDATION_MESSAGES.datesRequired;
  } else if (input.endDate < input.startDate) {
    fieldErrors.endDate = VALIDATION_MESSAGES.endBeforeStart;
  }

  if (input.durationMinutes !== null && !isValidDuration(input.durationMinutes)) {
    fieldErrors.durationMinutes = VALIDATION_MESSAGES.duration;
  }

  const hasStartTime = input.startTime !== null;
  const hasEndTime = input.endTime !== null;
  if (hasStartTime !== hasEndTime) {
    fieldErrors.startTime = VALIDATION_MESSAGES.hoursRequired;
  } else if (input.startTime !== null && input.endTime !== null && input.endTime <= input.startTime) {
    fieldErrors.endTime = VALIDATION_MESSAGES.endTimeBeforeStart;
  }

  if (isReasonRequired && !input.reason) {
    fieldErrors.reason = VALIDATION_MESSAGES.reasonRequired;
  }
  // הפירוט חובה בכל הבקשות (ספק 00 §4.3)
  if (!input.details.trim()) {
    fieldErrors.details = VALIDATION_MESSAGES.detailsRequired;
  }
  if (!APPROVERS_MOCK_DATA.some((approver) => approver.id === input.approverId)) {
    fieldErrors.approverId = VALIDATION_MESSAGES.approverRequired;
  }
  if (!APPROVED_FILES_MOCK_DATA.some((file) => file.id === input.approvedFileId)) {
    fieldErrors.approvedFileId = VALIDATION_MESSAGES.fileRequired;
  }

  return fieldErrors;
}

function isValidDuration(minutes: number): boolean {
  return Number.isInteger(minutes) && minutes >= MIN_DURATION_MINUTES && minutes <= MAX_DURATION_MINUTES;
}

/** 400 VALIDATION_ERROR כשיש שגיאות שדה */
export function throwIfInvalid(fieldErrors: Record<string, string>, message: string): void {
  if (Object.keys(fieldErrors).length > 0) {
    throw new MockHandlerError(HTTP_STATUS.badRequest, { code: "VALIDATION_ERROR", message, fieldErrors });
  }
}
