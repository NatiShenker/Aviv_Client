import type { ValidatedDecision } from "@/features/records/form/decisionLogic";
import type { MutationResultDto } from "@/schemas/common.schema";
import type { TraineePhoneRecordDto } from "@/schemas/phone-exceptions.schema";
import {
  createTraineePhonePermit,
  createTraineePhoneRestriction,
  updateTraineePhonePermit,
  updateTraineePhoneRestriction,
} from "@/services/phoneExceptionsService";
import type { NumberRecordRef } from "../numberRestrictionsLogic";
import {
  buildCreatePermitRequest,
  buildCreateRestrictionRequest,
  buildUpdatePermitRequest,
  buildUpdateRestrictionRequest,
  type NumberRecordFormState,
} from "./numberRecordFormLogic";

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
    return updateTraineePhoneRestriction(buildUpdateRestrictionRequest(state, decision, record));
  }
  if (record?.type === "permit") {
    return updateTraineePhonePermit(buildUpdatePermitRequest(state, decision, record));
  }
  if (state.recordType === "restriction") {
    return createTraineePhoneRestriction(buildCreateRestrictionRequest(state, decision, traineeId));
  }
  // היתר חדש נשמר רק אחרי שנבחרה הגבלה (הוולידציה בודקת זאת)
  if (state.selectedRestriction === null) return null;
  return createTraineePhonePermit(buildCreatePermitRequest(state, decision, traineeId, state.selectedRestriction));
}
