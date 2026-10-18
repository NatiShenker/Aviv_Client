import type { ISODateString } from "@/schemas/common.schema";
import type {
  CreateTraineeRestrictionRequest,
  TraineeRestrictionRecordDto,
  UpdateTraineeRestrictionRequest,
} from "@/schemas/trainee-restrictions.schema";
import type { DecisionValues } from "@/shared/components/form/DecisionBlock";
import {
  conditionsValuesFromRecord,
  createNewConditionsValues,
  toConditionsInput,
  validateDateRange,
  validateDuration,
  validateHours,
  type CallConditionsValues,
} from "@/shared/restrictions/callConditionsLogic";
import {
  createEmptyDecisionValues,
  decisionValuesFromRecord,
  toDecisionInput,
  validateDecision,
  type DecisionRules,
  type ValidatedDecision,
} from "@/shared/restrictions/decisionLogic";
import {
  CALL_FORM_SERVER_FIELD_SLOTS,
  mapServerFieldErrors,
  removeEmptyErrors,
  type CallFormErrorSlot,
  type FormErrors,
} from "@/shared/restrictions/formErrors";

// ── ערכי הטופס ──

export interface RestrictionFormValues extends CallConditionsValues, DecisionValues {}

/** ערכי פתיחה: הגבלה חדשה (ספק 03 form §4.1) או עריכה של רשומה קיימת */
export function createInitialRestrictionValues(
  record: TraineeRestrictionRecordDto | null,
  today: ISODateString,
): RestrictionFormValues {
  if (!record) {
    return { ...createNewConditionsValues(today), ...createEmptyDecisionValues() };
  }
  return { ...conditionsValuesFromRecord(record), ...decisionValuesFromRecord(record) };
}

/** בהגבלת חניך הסיבה חובה (CODE_RESTRICTION, ספק 00 §4.3) */
export const RESTRICTION_DECISION_RULES: DecisionRules = { isReasonRequired: true };

// ── שגיאות ──

export type RestrictionErrorSlot = CallFormErrorSlot;

export type RestrictionFormErrors = FormErrors<RestrictionErrorSlot>;

/** מקומות השגיאה בטופס, לפי סדר ההופעה שלהם מלמעלה למטה */
export const RESTRICTION_ERROR_SLOTS: readonly RestrictionErrorSlot[] = [
  "dates",
  "duration",
  "hours",
  "devices",
  "reason",
  "details",
  "approver",
  "file",
];

/** השדה שמקבל פוקוס כשיש שגיאה במקום הזה */
export const RESTRICTION_FIELD_IDS: Record<RestrictionErrorSlot, string> = {
  dates: "restriction-start-date",
  duration: "restriction-duration",
  hours: "restriction-start-time",
  devices: "restriction-devices",
  reason: "restriction-reason",
  details: "restriction-details",
  approver: "restriction-approver",
  file: "restriction-file",
};

// ── ולידציה (ספק 03 form §5, ובנוסף סיבה וגורם מאשר חובה - ספק 00 §4.3) ──

/** כל הכללים רצים יחד, ובכל מקום מוצגת רק השגיאה הראשונה */
export function validateRestrictionForm(values: RestrictionFormValues): RestrictionFormErrors {
  return removeEmptyErrors<RestrictionErrorSlot>({
    dates: validateDateRange(values),
    duration: validateDuration(values),
    hours: validateHours(values),
    ...validateDecision(values, RESTRICTION_DECISION_RULES),
  });
}

/** שגיאות שרת (400) → מקומות בטופס (ספק 03 form §6.3) */
export function mapRestrictionServerErrors(fieldErrors: Record<string, string>): RestrictionFormErrors {
  return mapServerFieldErrors(fieldErrors, CALL_FORM_SERVER_FIELD_SLOTS);
}

// ── בניית הבקשה (ספק 03 form §4.7, §6.1) ──

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
    ...toDecisionInput(values.details, decision),
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
    ...toDecisionInput(values.details, decision),
  };
}
