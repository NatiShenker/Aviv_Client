import { HTTP_STATUS } from "@/infrastructure/http/httpStatus";
import type { DecisionApprovalInput, ISODateString, PermittedCallConditionsInput } from "@/schemas/common.schema";
import type {
  CreateTraineeRestrictionRequest,
  CreateTraineeRestrictionResponse,
  GetTraineeRestrictionsRequest,
  GetTraineeRestrictionsResponse,
  TraineeRestrictionRecordDto,
  UpdateTraineeRestrictionRequest,
  UpdateTraineeRestrictionResponse,
} from "@/schemas/trainee-restrictions.schema";
import { APPROVED_FILES_MOCK_DATA } from "../data/approvedFilesMockData";
import { APPROVERS_MOCK_DATA } from "../data/approversMockData";
import { buildAuditMetadata } from "../data/recordMetadataBuilders";
import { DEVICES_MOCK_DATA } from "../data/devicesMockData";
import { TRAINEE_RESTRICTIONS_MOCK_DATA } from "../data/traineeRestrictionsMockData";
import { MockHandlerError, type MockRequest } from "../mockRequest";

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
  assertValidRestrictionInput(input);

  const records = input.traineeIds.map((traineeId) => {
    const id = nextRestrictionId();
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
    throw new MockHandlerError(HTTP_STATUS.notFound, {
      code: "NOT_FOUND",
      message: `No trainee restriction ${input.previousRestrictionId}`,
    });
  }
  if (!previous.isActive) {
    throw new MockHandlerError(HTTP_STATUS.conflict, {
      code: "CONFLICT",
      message: `Trainee restriction ${input.previousRestrictionId} was already replaced`,
    });
  }
  assertValidRestrictionInput(input);

  // עדכון לא משנה רשומה: הקודמת נכבית, ונוספת רשומה פעילה חדשה עם אותו מזהה לוגי
  previous.isActive = false;
  const record = buildRestrictionRecord(input, {
    id: nextRestrictionId(),
    traineeId: previous.traineeId,
    restrictionUid: previous.restrictionUid,
  });
  TRAINEE_RESTRICTIONS_MOCK_DATA.push(record);
  return toMutationResult([record]);
}

// ── ולידציה: השרת חוזר על כל כללי הטופס (ספק 00 §7, ספק 03 form §5) ──

type RestrictionInput = PermittedCallConditionsInput &
  DecisionApprovalInput & { startDate: ISODateString; endDate: ISODateString };

const MIN_DURATION_MINUTES = 1;
const MAX_DURATION_MINUTES = 120;

const VALIDATION_MESSAGES = {
  datesRequired: "יש לבחור תאריך התחלה ותאריך סיום",
  endBeforeStart: "תאריך הסיום לא יכול להיות לפני תאריך ההתחלה",
  duration: "יש להזין מספר דקות שלם בין 1 ל-120",
  hoursRequired: "יש לבחור שעת התחלה ושעת סיום",
  endTimeBeforeStart: "שעת הסיום חייבת להיות אחרי שעת ההתחלה",
  reasonRequired: "יש לבחור סיבה",
  approverRequired: "יש לבחור גורם מאשר",
  fileRequired: "יש לצרף קובץ",
} as const;

function assertValidRestrictionInput(input: RestrictionInput): void {
  const fieldErrors = validateRestrictionInput(input);
  if (Object.keys(fieldErrors).length > 0) {
    throw new MockHandlerError(HTTP_STATUS.badRequest, {
      code: "VALIDATION_ERROR",
      message: "Trainee restriction is invalid",
      fieldErrors,
    });
  }
}

function validateRestrictionInput(input: RestrictionInput): Record<string, string> {
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

  if (!input.reason) {
    fieldErrors.reason = VALIDATION_MESSAGES.reasonRequired;
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

// ── בניית הרשומה ──

const RESTRICTION_UID_PREFIX = "TR-";
// הערך של CODE_RESTRICTION טרם הוגדר מול ה-DB; כשאין קוד סיבה - ערך קבוע לדוגמה
const PLACEHOLDER_RESTRICTION_CODE = 1;
// המשתמש המחובר עדיין לא מדומה (shared-types); מזהה קבוע לדוגמה
const MOCK_CURRENT_USER_ID = 1;
const REQUEST_UID_PREFIX = "REQ-";

interface RecordIdentity {
  id: number;
  traineeId: number;
  restrictionUid: string;
}

function buildRestrictionRecord(input: RestrictionInput, identity: RecordIdentity): TraineeRestrictionRecordDto {
  const approver = APPROVERS_MOCK_DATA.find((candidate) => candidate.id === input.approverId);
  const approvedFile = APPROVED_FILES_MOCK_DATA.find((file) => file.id === input.approvedFileId);
  if (!approver || !approvedFile) {
    // הוולידציה כבר וידאה ששניהם קיימים
    throw new Error("Approver and approved file must exist after validation");
  }

  return {
    ...identity,
    restrictionCode: input.reasonCode ?? PLACEHOLDER_RESTRICTION_CODE,
    startDate: input.startDate,
    endDate: input.endDate,
    durationMinutes: input.durationMinutes,
    startTime: input.startTime,
    endTime: input.endTime,
    devices: DEVICES_MOCK_DATA.filter((device) => input.deviceIds.includes(device.id)).map(({ id, name }) => ({
      id,
      name,
    })),
    reason: input.reason,
    details: input.details,
    approver,
    approvedFile,
    ...buildAuditMetadata(input.startDate, input.endDate, 0, MOCK_CURRENT_USER_ID),
  };
}

function nextRestrictionId(): number {
  return Math.max(0, ...TRAINEE_RESTRICTIONS_MOCK_DATA.map((restriction) => restriction.id)) + 1;
}

function toMutationResult(records: TraineeRestrictionRecordDto[]): CreateTraineeRestrictionResponse {
  return {
    createdIds: records.map((record) => record.id),
    requestUid: `${REQUEST_UID_PREFIX}${Date.now()}`,
    syncStatus: "pending",
    records,
  };
}
