import { toConditionsInput } from "@/features/records/form/call-conditions/callConditionsLogic";
import { toApprovalInput, type ValidatedDecision } from "@/features/records/form/decision/decisionLogic";
import {
  createTraineePhonePermit,
  createTraineePhoneRestriction,
  updateTraineePhonePermit,
  updateTraineePhoneRestriction,
} from "@/services/phoneExceptionsService";
import type { MutationResultDto } from "@/types/common.schema";
import type {
  CreateTraineePhonePermitRequest,
  CreateTraineePhoneRestrictionRequest,
  PhonePermitSaveFields,
  PhoneRestrictionSaveFields,
  SourceRestrictionSummaryDto,
  TraineePhoneRecordDto,
  UpdateTraineePhonePermitRequest,
  UpdateTraineePhoneRestrictionRequest,
} from "@/types/phone-exceptions.schema";
import type { NumberRecordRef } from "../numberRestrictionsLogic";
import type { NumberRecordFormState, NumberRecordFormValues } from "./numberRecordFormLogic";

interface SaveNumberRecordOptions {
  state: NumberRecordFormState;
  decision: ValidatedDecision;
  traineeId: number;
  /** הפנימייה של החניך - השרת בודק איתה שהגבלה פנימייתית חלה עליו (C-6). null = בלי הבדיקה */
  instituteId: number | null;
  /** בעריכה - הרשומה שמוחלפת */
  record: TraineePhoneRecordDto | null;
}

/**
 * שולח את הבקשה המתאימה מבין ארבע (ספק 04 overview §5): יצירה או עדכון, של הגבלה או של היתר.
 * מחזיר את הרשומה הראשונה שנשמרה (בהגבלה על כמה מספרים - של המספר הראשון), או null אם לא נשמרה.
 */
export async function saveNumberRecord(options: SaveNumberRecordOptions): Promise<NumberRecordRef | null> {
  const result = await sendSaveRequest(options);
  const savedId = result?.createdIds[0];
  return savedId === undefined ? null : { type: options.state.recordType, id: savedId };
}

function sendSaveRequest({
  state,
  decision,
  traineeId,
  instituteId,
  record,
}: SaveNumberRecordOptions): Promise<MutationResultDto> | null {
  if (record && !record.isPermit) {
    return updateTraineePhoneRestriction(buildUpdateNumberRestrictionRequest(state, decision, record.id));
  }
  if (record?.isPermit) {
    return updateTraineePhonePermit(buildUpdatePermitRequest(state, decision, record.id));
  }
  if (state.recordType === "restriction") {
    return createTraineePhoneRestriction(buildCreateNumberRestrictionRequest(state, decision, traineeId));
  }
  // היתר חדש נשמר רק אחרי שנבחרה הגבלה (הוולידציה בודקת זאת)
  if (state.selectedRestriction === null) return null;
  return createTraineePhonePermit(
    buildCreatePermitRequest(state, decision, traineeId, instituteId, state.selectedRestriction),
  );
}

// ── שמירה: בניית הבקשות (ספק 04 form §6.1), בשמות השרת ──

/** שדות ההגבלה המשותפים ליצירה ולעדכון. I-23: קוד הסיבה מתקבל בשרת ולא נשמר עד שתהיה עמודה */
function buildRestrictionFields(values: NumberRecordFormValues, decision: ValidatedDecision): PhoneRestrictionSaveFields {
  return {
    dateRestrictionStart: values.startDate,
    dateRestrictionEnd: values.endDate,
    ...toConditionsInput(values),
    textRestrictionReason: values.details,
    codeRestrictionReason: decision.reasonId,
    ...toApprovalInput(decision),
  };
}

/** שדות ההיתר המשותפים ליצירה ולעדכון */
function buildPermitFields(values: NumberRecordFormValues, decision: ValidatedDecision): PhonePermitSaveFields {
  return {
    datePermitStart: values.startDate,
    datePermitEnd: values.endDate,
    ...toConditionsInput(values),
    textPermitReason: values.details,
    codePermitReason: decision.reasonId,
    ...toApprovalInput(decision),
  };
}

/** כל מספר יישמר כהגבלה נפרדת עם אותם ערכים (P-12) */
function buildCreateNumberRestrictionRequest(
  state: NumberRecordFormState,
  decision: ValidatedDecision,
  traineeId: number,
): CreateTraineePhoneRestrictionRequest {
  return {
    idntTraineeList: [traineeId],
    phoneNumberList: state.addedPhones,
    ...buildRestrictionFields(state.values, decision),
  };
}

/** המספר והחניך נעולים בעריכה ונלקחים בשרת מהרשומה הקודמת (D-1) */
function buildUpdateNumberRestrictionRequest(
  state: NumberRecordFormState,
  decision: ValidatedDecision,
  previousId: number,
): UpdateTraineePhoneRestrictionRequest {
  return { idntPrevious: previousId, ...buildRestrictionFields(state.values, decision) };
}

function buildCreatePermitRequest(
  state: NumberRecordFormState,
  decision: ValidatedDecision,
  traineeId: number,
  instituteId: number | null,
  restriction: SourceRestrictionSummaryDto,
): CreateTraineePhonePermitRequest {
  return {
    idntTraineeList: [traineeId],
    idntInstitution: instituteId,
    idntAvivRestrictionNumber: restriction.idntAvivRestrictionNumber,
    ...buildPermitFields(state.values, decision),
  };
}

/** ההגבלה והחניך נעולים בעריכה ונלקחים בשרת מההיתר הקודם (D-1) */
function buildUpdatePermitRequest(
  state: NumberRecordFormState,
  decision: ValidatedDecision,
  previousId: number,
): UpdateTraineePhonePermitRequest {
  return { idntPrevious: previousId, ...buildPermitFields(state.values, decision) };
}
