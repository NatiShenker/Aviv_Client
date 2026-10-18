import type {
  CreateTraineeRestrictionRequest,
  CreateTraineeRestrictionResponse,
  GetTraineeRestrictionsRequest,
  GetTraineeRestrictionsResponse,
  TraineeRestrictionRecordDto,
  UpdateTraineeRestrictionRequest,
  UpdateTraineeRestrictionResponse,
} from "@/schemas/trainee-restrictions.schema";
import { buildAuditMetadata } from "../data/recordMetadataBuilders";
import { TRAINEE_RESTRICTIONS_MOCK_DATA } from "../data/traineeRestrictionsMockData";
import type { MockRequest } from "../mockRequest";
import {
  MOCK_CURRENT_USER_ID,
  decisionFromInput,
  devicesFromIds,
  nextRecordId,
  throwConflict,
  throwNotFound,
  toMutationResult,
} from "./mutationHelpers";
import { throwIfInvalid, validateConditionsAndDecision, type ConditionsAndDecisionInput } from "./recordInputValidation";

// בהגבלת חניך הסיבה חובה (ספק 00 §4.3)
const VALIDATION_RULES = { isReasonRequired: true };
const INVALID_INPUT_MESSAGE = "Trainee restriction is invalid";

// רק הגרסה הפעילה של כל רשומה (LOGI_ACTIVE = 1). עדכון יוצר רשומה חדשה ומכבה את הקודמת
export function handleGetTraineeRestrictions(request: MockRequest): GetTraineeRestrictionsResponse {
  const { traineeIds } = request.body as GetTraineeRestrictionsRequest;

  const records = TRAINEE_RESTRICTIONS_MOCK_DATA.filter(
    (restriction) => restriction.isActive && traineeIds.includes(restriction.traineeId),
  );
  return { records };
}

export function handleCreateTraineeRestriction(request: MockRequest): CreateTraineeRestrictionResponse {
  const input = request.body as CreateTraineeRestrictionRequest;
  throwIfInvalid(validateConditionsAndDecision(input, VALIDATION_RULES), INVALID_INPUT_MESSAGE);

  const records = input.traineeIds.map((traineeId) => {
    const id = nextRecordId(TRAINEE_RESTRICTIONS_MOCK_DATA);
    const record = buildRestrictionRecord(input, { id, traineeId, restrictionUid: `${RESTRICTION_UID_PREFIX}${id}` });
    TRAINEE_RESTRICTIONS_MOCK_DATA.push(record);
    return record;
  });
  return toMutationResult(records);
}

export function handleUpdateTraineeRestriction(request: MockRequest): UpdateTraineeRestrictionResponse {
  const input = request.body as UpdateTraineeRestrictionRequest;
  const previous = TRAINEE_RESTRICTIONS_MOCK_DATA.find((restriction) => restriction.id === input.previousRestrictionId);

  if (!previous) {
    throwNotFound(`No trainee restriction ${input.previousRestrictionId}`);
  }
  if (!previous.isActive) {
    throwConflict(`Trainee restriction ${input.previousRestrictionId} was already replaced`);
  }
  throwIfInvalid(validateConditionsAndDecision(input, VALIDATION_RULES), INVALID_INPUT_MESSAGE);

  // עדכון לא משנה רשומה: הקודמת נכבית, ונוספת רשומה פעילה חדשה עם אותו מזהה לוגי
  previous.isActive = false;
  const record = buildRestrictionRecord(input, {
    id: nextRecordId(TRAINEE_RESTRICTIONS_MOCK_DATA),
    traineeId: previous.traineeId,
    restrictionUid: previous.restrictionUid,
  });
  TRAINEE_RESTRICTIONS_MOCK_DATA.push(record);
  return toMutationResult([record]);
}

// ── בניית הרשומה ──

const RESTRICTION_UID_PREFIX = "TR-";
// הערך של CODE_RESTRICTION טרם הוגדר מול ה-DB; כשאין קוד סיבה - ערך קבוע לדוגמה
const PLACEHOLDER_RESTRICTION_CODE = 1;

interface RecordIdentity {
  id: number;
  traineeId: number;
  restrictionUid: string;
}

function buildRestrictionRecord(
  input: ConditionsAndDecisionInput,
  identity: RecordIdentity,
): TraineeRestrictionRecordDto {
  return {
    ...identity,
    restrictionCode: input.reasonCode ?? PLACEHOLDER_RESTRICTION_CODE,
    startDate: input.startDate,
    endDate: input.endDate,
    durationMinutes: input.durationMinutes,
    startTime: input.startTime,
    endTime: input.endTime,
    devices: devicesFromIds(input.deviceIds),
    ...decisionFromInput(input),
    ...buildAuditMetadata(input.startDate, input.endDate, 0, MOCK_CURRENT_USER_ID),
  };
}
