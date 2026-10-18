import {
  conditionsValuesFromRecord,
  createNewConditionsValues,
  toConditionsInput,
  validateDuration,
  validateHours,
  type CallConditionsValues,
} from "@/features/records/form/callConditionsLogic";
import { createDefaultDateRange, validateDateRange } from "@/features/records/form/dateRangeLogic";
import type { DecisionValues } from "@/features/records/form/DecisionBlock";
import {
  createBasedOnDecisionValues,
  createEmptyDecisionValues,
  decisionValuesFromRecord,
  toDecisionInput,
  validateDecision,
  type ValidatedDecision,
} from "@/features/records/form/decisionLogic";
import {
  CALL_FORM_SERVER_FIELD_SLOTS,
  mapServerFieldErrors,
  removeEmptyErrors,
  type CallFormErrorSlot,
  type FormErrors,
} from "@/features/records/form/formErrors";
import type { FormStartingPoint } from "@/features/records/form/formStartingPoint";
import type { ISODateString } from "@/schemas/common.schema";
import type {
  CreateTraineeRestrictionRequest,
  TraineeRestrictionRecordDto,
  UpdateTraineeRestrictionRequest,
} from "@/schemas/trainee-restrictions.schema";

// ── ערכי הטופס ──

export interface RestrictionFormValues extends CallConditionsValues, DecisionValues {}

/**
 * ערכי פתיחה (ספק 03 form §4.1): הגבלה חדשה, עריכה של רשומה, או הגבלה חדשה על בסיס רשומה שהסתיימה -
 * הסוג והתנאים, הסיבה והפירוט עוברים; התאריכים, הגורם המאשר והקובץ חדשים
 */
export function createInitialRestrictionValues(
  startingPoint: FormStartingPoint<TraineeRestrictionRecordDto>,
  today: ISODateString,
): RestrictionFormValues {
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

export type RestrictionErrorSlot = CallFormErrorSlot;

export type RestrictionFormErrors = FormErrors<RestrictionErrorSlot>;

/** מקומות השגיאה בטופס, לפי סדר ההופעה שלהם מלמעלה למטה */
export const RESTRICTION_ERROR_SLOTS: readonly RestrictionErrorSlot[] = [
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
    duration: validateDuration(values),
    dates: validateDateRange(values),
    hours: validateHours(values),
    ...validateDecision(values),
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
