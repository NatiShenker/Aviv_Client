import type {
  CreateTraineeRestrictionRequest,
  CreateTraineeRestrictionResponse,
  GetTraineeRestrictionsRequest,
  GetTraineeRestrictionsResponse,
  TraineeRestrictionRecordDto,
  TraineeRestrictionSaveFields,
  UpdateTraineeRestrictionRequest,
  UpdateTraineeRestrictionResponse,
} from "@/types/trainee-restrictions.schema";
import { buildAuditMetadata } from "../data/recordMetadataBuilders";
import { activeRecords, toRecordDto, type StoredRecord } from "../data/storedRecords";
import { TRAINEE_RESTRICTIONS_MOCK_DATA } from "../data/traineeRestrictionsMockData";
import type { MockRequest } from "../mockRequest";
import {
  MOCK_CURRENT_USER_ID,
  allocateFileId,
  decisionFromInput,
  findReplaceableRecord,
  nextRecordId,
  toMutationResult,
} from "./mutationHelpers";
import {
  SERVER_FIELDS,
  checkApproval,
  checkConditions,
  requireDateRange,
  requireIdList,
  requirePositive,
  throwIfInvalid,
  type FailedField,
} from "./recordInputValidation";

/*
 * "הגבלות לחניך" (ספק 03), כמו TraineeRestrictionsController והפרוצדורות שלו:
 * עדכון לא משנה רשומה - הקודמת נכבית (LOGI_ACTIVE = 0) ונוספת רשומה פעילה חדשה (D-1, T-7).
 */

// ── שליפה (B-5): רק הגרסה הפעילה של כל רשומה ──

export function handleGetTraineeRestrictions(request: MockRequest): GetTraineeRestrictionsResponse {
  const { idntTraineeList } = request.body as GetTraineeRestrictionsRequest;
  throwIfInvalid(requireIdList(idntTraineeList, SERVER_FIELDS.idntTraineeList));

  const records = activeRecords(TRAINEE_RESTRICTIONS_MOCK_DATA)
    .filter((restriction) => idntTraineeList.includes(restriction.idntTrainee))
    .map(toRecordDto);
  return { records };
}

// ── יצירה: רשומה לכל חניך (P-12) ──

export function handleCreateTraineeRestriction(request: MockRequest): CreateTraineeRestrictionResponse {
  const input = request.body as CreateTraineeRestrictionRequest;
  throwIfInvalid(requireIdList(input.idntTraineeList, SERVER_FIELDS.idntTraineeList) ?? checkSaveFields(input));

  // D-13: שורת קובץ אחת לכל שמירה
  const fileId = allocateFileId();
  const records = input.idntTraineeList.map((idntTrainee) => {
    const record = buildRestrictionRecord(input, { id: nextRecordId(TRAINEE_RESTRICTIONS_MOCK_DATA), idntTrainee, fileId });
    TRAINEE_RESTRICTIONS_MOCK_DATA.push(record);
    return record;
  });
  return toMutationResult(records.map((record) => record.id));
}

// ── עדכון: גרסה חדשה (T-7) ──

export function handleUpdateTraineeRestriction(request: MockRequest): UpdateTraineeRestrictionResponse {
  const input = request.body as UpdateTraineeRestrictionRequest;
  throwIfInvalid(requirePositive(input.idntPrevious, SERVER_FIELDS.idntPrevious) ?? checkSaveFields(input));

  // תפיסת הגרסה הקודמת (409 כשאינה קיימת, הוחלפה או הסתיימה); החניך נלקח ממנה ולא מהבקשה (T-9)
  const previous = findReplaceableRecord(TRAINEE_RESTRICTIONS_MOCK_DATA, input.idntPrevious);
  previous.isActive = false;

  const record = buildRestrictionRecord(input, {
    id: nextRecordId(TRAINEE_RESTRICTIONS_MOCK_DATA),
    idntTrainee: previous.idntTrainee,
    fileId: allocateFileId(),
  });
  TRAINEE_RESTRICTIONS_MOCK_DATA.push(record);
  return toMutationResult([record.id]);
}

// ── אימות (TraineeRestrictionsRequestValidator) ──

function checkSaveFields(input: TraineeRestrictionSaveFields): FailedField {
  return (
    requireDateRange(
      input.dateRestrictionStart,
      input.dateRestrictionEnd,
      SERVER_FIELDS.dateRestrictionStart,
      SERVER_FIELDS.dateRestrictionEnd,
    ) ??
    checkConditions(input) ??
    checkApproval(
      input.textRestrictionReason,
      SERVER_FIELDS.textRestrictionReason,
      input.codeRestrictionReason,
      SERVER_FIELDS.codeRestrictionReason,
      input,
    )
  );
}

// ── בניית הרשומה ──

interface RecordIdentity {
  id: number;
  idntTrainee: number;
  fileId: number;
}

// codeRestrictionReason מתקבל ולא נשמר, כמו בפרוצדורה (I-23)
function buildRestrictionRecord(
  input: TraineeRestrictionSaveFields,
  identity: RecordIdentity,
): StoredRecord<TraineeRestrictionRecordDto> {
  return {
    id: identity.id,
    idntTrainee: identity.idntTrainee,
    dateStart: input.dateRestrictionStart,
    dateEnd: input.dateRestrictionEnd,
    numbDurationLimit: input.numbDurationLimit,
    timePermitStart: input.timePermitStart,
    timePermitEnd: input.timePermitEnd,
    // E-8: מזהי המכשירים כפי שנשלחו (אחרי הסרת כפילויות באימות), כמו AVIV_PERMITS_DEVICE
    idntDeviceList: input.idntDeviceList,
    ...decisionFromInput(input.textRestrictionReason, input, identity.fileId),
    ...buildAuditMetadata(input.dateRestrictionEnd, 0, MOCK_CURRENT_USER_ID),
    isActive: true,
  };
}
