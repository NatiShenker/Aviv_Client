import {
  conditionsValuesFromRecord,
  createNewConditionsValues,
  toConditionsInput,
  validateDuration,
  validateHours,
  type CallConditionsValues,
} from "@/features/records/form/call-conditions/callConditionsLogic";
import { createDefaultDateRange, validateDateRange } from "@/features/records/form/dateRangeLogic";
import {
  createBasedOnDecisionValues,
  createEmptyDecisionValues,
  decisionValuesFromRecord,
  toApprovalInput,
  validateDecision,
  type DecisionValues,
  type ValidatedDecision,
} from "@/features/records/form/decision/decisionLogic";
import {
  CALL_FORM_SERVER_FIELD_SLOTS,
  mapServerFieldErrors,
  removeEmptyErrors,
  type CallFormErrorSlot,
  type FormErrors,
} from "@/features/records/form/formErrors";
import type { FormStartingPoint } from "@/features/records/form/formStartingPoint";
import type { ISODateString } from "@/types/common.schema";
import type {
  CreateTraineeRestrictionRequest,
  TraineeRestrictionRecordDto,
  TraineeRestrictionSaveFields,
  UpdateTraineeRestrictionRequest,
} from "@/types/trainee-restrictions.schema";

// ── ערכי הטופס ──

export interface TraineeRestrictionFormValues extends CallConditionsValues, DecisionValues {}

/**
 * ערכי פתיחה (ספק 03 form §4.1): הגבלה חדשה, עריכה של רשומה, או הגבלה חדשה על בסיס רשומה שהסתיימה -
 * הסוג והתנאים, הסיבה והפירוט עוברים; התאריכים, הגורם המאשר והקובץ חדשים
 */
export function createInitialTraineeRestrictionValues(
  startingPoint: FormStartingPoint<TraineeRestrictionRecordDto>,
  today: ISODateString,
): TraineeRestrictionFormValues {
  switch (startingPoint.kind) {
    case "new":
      return { ...createNewConditionsValues(today), ...createEmptyDecisionValues() };
    case "edit":
      return { ...conditionsValuesFromRecord(startingPoint.record), ...decisionValuesFromRecord(startingPoint.record) };
    case "basedOn":
      return {
        ...conditionsValuesFromRecord(startingPoint.record),
        ...createDefaultDateRange(today),
        ...createBasedOnDecisionValues(startingPoint.record),
      };
  }
}

// ── שגיאות ──

export type TraineeRestrictionErrorSlot = CallFormErrorSlot;

export type TraineeRestrictionFormErrors = FormErrors<TraineeRestrictionErrorSlot>;

/** מקומות השגיאה בטופס, לפי סדר ההופעה שלהם מלמעלה למטה */
export const RESTRICTION_ERROR_SLOTS: readonly TraineeRestrictionErrorSlot[] = [
  "duration",
  "dates",
  "hours",
  "devices",
  "reason",
  "details",
  "approver",
  "file",
];

/** השדה שמקבל פוקוס כשיש שגיאה במקום הזה */
export const RESTRICTION_FIELD_IDS: Record<TraineeRestrictionErrorSlot, string> = {
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
export function validateTraineeRestrictionForm(values: TraineeRestrictionFormValues): TraineeRestrictionFormErrors {
  return removeEmptyErrors<TraineeRestrictionErrorSlot>({
    duration: validateDuration(values),
    dates: validateDateRange(values),
    hours: validateHours(values),
    ...validateDecision(values),
  });
}

/** שגיאות שרת (400) → מקומות בטופס (ספק 03 form §6.3), לפי שמות השדות של השרת (C-4) */
export function mapTraineeRestrictionServerErrors(fieldErrors: Record<string, string>): TraineeRestrictionFormErrors {
  return mapServerFieldErrors(fieldErrors, CALL_FORM_SERVER_FIELD_SLOTS);
}

// ── בניית הבקשה (ספק 03 form §4.7, §6.1) ──

export function buildCreateTraineeRestrictionRequest(
  values: TraineeRestrictionFormValues,
  decision: ValidatedDecision,
  traineeId: number,
): CreateTraineeRestrictionRequest {
  return { idntTraineeList: [traineeId], ...buildSaveFields(values, decision) };
}

export function buildUpdateTraineeRestrictionRequest(
  values: TraineeRestrictionFormValues,
  decision: ValidatedDecision,
  record: TraineeRestrictionRecordDto,
): UpdateTraineeRestrictionRequest {
  // T-9: החניך נלקח בשרת מהרשומה הקודמת ולא נשלח
  return { idntPrevious: record.id, ...buildSaveFields(values, decision) };
}

/** השדות המשותפים ליצירה ולעדכון, בשמות השרת */
function buildSaveFields(values: TraineeRestrictionFormValues, decision: ValidatedDecision): TraineeRestrictionSaveFields {
  return {
    dateRestrictionStart: values.startDate,
    dateRestrictionEnd: values.endDate,
    ...toConditionsInput(values),
    textRestrictionReason: values.details,
    // I-23: קוד הסיבה מתקבל בשרת ולא נשמר עד שתהיה עמודה (pending-decisions)
    codeRestrictionReason: decision.reasonId,
    ...toApprovalInput(decision),
  };
}
