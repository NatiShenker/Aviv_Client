import { toConditionsInput } from "@/features/records/form/callConditionsLogic";
import { toDecisionInput, type ValidatedDecision } from "@/features/records/form/decisionLogic";
import type { ISODateString, MutationResultDto, PermittedCallConditionsInput } from "@/schemas/common.schema";
import type {
  CreateTraineePhonePermitRequest,
  CreateTraineePhoneRestrictionRequest,
  SourceRestrictionSummaryDto,
  TraineePhonePermitRecordDto,
  TraineePhoneRecordDto,
  TraineePhoneRestrictionRecordDto,
  UpdateTraineePhonePermitRequest,
  UpdateTraineePhoneRestrictionRequest,
} from "@/schemas/phone-exceptions.schema";
import {
  createTraineePhonePermit,
  createTraineePhoneRestriction,
  updateTraineePhonePermit,
  updateTraineePhoneRestriction,
} from "@/services/phoneExceptionsService";
import type { NumberRecordRef } from "../numberRestrictionsLogic";
import type { NumberRecordFormState, NumberRecordFormValues } from "./numberRecordFormLogic";

interface SaveNumberRecordOptions {
  state: NumberRecordFormState;
  decision: ValidatedDecision;
  traineeId: number;
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
  record,
}: SaveNumberRecordOptions): Promise<MutationResultDto> | null {
  if (record?.type === "restriction") {
    return updateTraineePhoneRestriction(buildUpdateNumberRestrictionRequest(state, decision, record));
  }
  if (record?.type === "permit") {
    return updateTraineePhonePermit(buildUpdatePermitRequest(state, decision, record));
  }
  if (state.recordType === "restriction") {
    return createTraineePhoneRestriction(buildCreateNumberRestrictionRequest(state, decision, traineeId));
  }
  // היתר חדש נשמר רק אחרי שנבחרה הגבלה (הוולידציה בודקת זאת)
  if (state.selectedRestriction === null) return null;
  return createTraineePhonePermit(buildCreatePermitRequest(state, decision, traineeId, state.selectedRestriction));
}

// ── שמירה: בניית הבקשות (ספק 04 form §6.1) ──

type DatesAndConditionsInput = PermittedCallConditionsInput & { startDate: ISODateString; endDate: ISODateString };

function datesAndConditions(values: NumberRecordFormValues): DatesAndConditionsInput {
  return { startDate: values.startDate, endDate: values.endDate, ...toConditionsInput(values) };
}

/** כל מספר יישמר כהגבלה נפרדת עם אותם ערכים */
function buildCreateNumberRestrictionRequest(
  state: NumberRecordFormState,
  decision: ValidatedDecision,
  traineeId: number,
): CreateTraineePhoneRestrictionRequest {
  return {
    traineeIds: [traineeId],
    phoneNumbers: state.addedPhones,
    ...datesAndConditions(state.values),
    ...toDecisionInput(state.values.details, decision),
  };
}

function buildUpdateNumberRestrictionRequest(
  state: NumberRecordFormState,
  decision: ValidatedDecision,
  record: TraineePhoneRestrictionRecordDto,
): UpdateTraineePhoneRestrictionRequest {
  return {
    previousId: record.id,
    traineeId: record.traineeId,
    phoneNumber: record.phoneNumber,
    ...datesAndConditions(state.values),
    ...toDecisionInput(state.values.details, decision),
  };
}

function buildCreatePermitRequest(
  state: NumberRecordFormState,
  decision: ValidatedDecision,
  traineeId: number,
  restriction: SourceRestrictionSummaryDto,
): CreateTraineePhonePermitRequest {
  return {
    traineeIds: [traineeId],
    sourceRestrictionId: restriction.restrictionId,
    ...datesAndConditions(state.values),
    ...toDecisionInput(state.values.details, decision),
  };
}

function buildUpdatePermitRequest(
  state: NumberRecordFormState,
  decision: ValidatedDecision,
  record: TraineePhonePermitRecordDto,
): UpdateTraineePhonePermitRequest {
  return {
    previousPermitId: record.id,
    traineeId: record.traineeId,
    sourceRestrictionId: record.sourceRestriction.restrictionId,
    ...datesAndConditions(state.values),
    ...toDecisionInput(state.values.details, decision),
  };
}
