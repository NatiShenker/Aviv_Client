import type { ISODateString, PermittedCallConditionsDto, PhoneString } from "@/schemas/common.schema";
import type {
  CreateTraineePhonePermitRequest,
  CreateTraineePhonePermitResponse,
  CreateTraineePhoneRestrictionRequest,
  CreateTraineePhoneRestrictionResponse,
  ExistingPermitBriefDto,
  GetTraineePhoneRecordsRequest,
  GetTraineePhoneRecordsResponse,
  LookupPhoneRestrictionsForPermitRequest,
  LookupPhoneRestrictionsForPermitResponse,
  PhoneRestrictionScope,
  SourceRestrictionSummaryDto,
  TraineePhonePermitRecordDto,
  TraineePhoneRecordDto,
  TraineePhoneRestrictionRecordDto,
  UpdateTraineePhonePermitRequest,
  UpdateTraineePhonePermitResponse,
  UpdateTraineePhoneRestrictionRequest,
  UpdateTraineePhoneRestrictionResponse,
} from "@/schemas/phone-exceptions.schema";
import { formatDateRange } from "@/shared/formatting/dateFormat";
import { isValidPhone } from "@/shared/formatting/phoneFormat";
import { GLOBAL_PHONE_RESTRICTIONS_MOCK_DATA } from "../data/globalPhoneRestrictionsMockData";
import { buildAuditMetadata } from "../data/recordMetadataBuilders";
import { summarizeGlobalRestriction, summarizeTraineeRestriction } from "../data/sourceRestrictionBuilders";
import { TRAINEE_PHONE_RECORDS_MOCK_DATA } from "../data/traineePhoneRecordsMockData";
import { TRAINEES_MOCK_DATA } from "../data/traineesMockData";
import { todayIsoDate } from "../mockDates";
import type { MockRequest } from "../mockRequest";
import {
  MOCK_CURRENT_USER_ID,
  decisionFromInput,
  devicesFromIds,
  nextRecordId,
  throwConflict,
  throwIfEnded,
  throwNotFound,
  toMutationResult,
} from "./mutationHelpers";
import { throwIfInvalid, validateConditionsAndDecision, type ConditionsAndDecisionInput } from "./recordInputValidation";

/*
 * "הגבלה/היתר למספר" (ספק 04): רשומות החניך, איתור ההגבלות ליצירת היתר, ושמירה של הגבלות והיתרים.
 * כמו בשרת: עדכון לא משנה רשומה - הקודמת נכבית (LOGI_ACTIVE = 0) ונוספת רשומה פעילה חדשה.
 */

const INVALID_INPUT_MESSAGE = "Phone restriction / permit is invalid";

const PHONE_VALIDATION_MESSAGES = {
  invalid: "מספר טלפון לא תקין",
  required: "יש להוסיף לפחות מספר אחד",
  permitOutsideRestriction: (range: string) => `תאריכי ההיתר חייבים להיות בתוך תקופת ההגבלה (${range})`,
} as const;

// ── שליפת הרשומות (ספק 04 history §6) ──

export function handleGetTraineePhoneRecords(request: MockRequest): GetTraineePhoneRecordsResponse {
  const { traineeIds } = request.body as GetTraineePhoneRecordsRequest;

  const records = TRAINEE_PHONE_RECORDS_MOCK_DATA.filter(
    (record) => record.isActive && traineeIds.includes(record.traineeId),
  ).map(withCurrentSourceRestriction);
  return { records };
}

// "על הגבלה" מוצג מההגבלה כפי שהיא עכשיו (JOIN), ולא מהעותק שנשמר עם ההיתר (ספק 04 overview §2.3)
function withCurrentSourceRestriction(record: TraineePhoneRecordDto): TraineePhoneRecordDto {
  if (record.type !== "permit") return record;
  const currentRestriction = findSourceRestriction(record.sourceRestriction.restrictionId);
  return currentRestriction ? { ...record, sourceRestriction: currentRestriction } : record;
}

// ── איתור ההגבלות ליצירת היתר (ספק 04 overview §2.7) ──

export function handleLookupPhoneRestrictionsForPermit(request: MockRequest): LookupPhoneRestrictionsForPermitResponse {
  const { traineeId, instituteId, phoneNumbers } = request.body as LookupPhoneRestrictionsForPermitRequest;

  return {
    results: phoneNumbers.map((phoneNumber) => ({
      phoneNumber,
      activeRestrictions: findApplicableRestrictions(traineeId, instituteId, phoneNumber),
    })),
  };
}

const SCOPE_ORDER: Record<PhoneRestrictionScope, number> = { national: 0, institute: 1, trainee: 2 };

/** ארציות, של הפנימייה של החניך ושל החניך עצמו; רק כאלה שלא הסתיימו, כולל עתידיות */
function findApplicableRestrictions(
  traineeId: number,
  instituteId: number,
  phoneNumber: PhoneString,
): SourceRestrictionSummaryDto[] {
  const today = todayIsoDate();
  const globalRestrictions = GLOBAL_PHONE_RESTRICTIONS_MOCK_DATA.filter(
    (restriction) =>
      restriction.isActive &&
      restriction.phoneNumber === phoneNumber &&
      restriction.endDate >= today &&
      (restriction.scope === "national" || restriction.institutes.some((institute) => institute.id === instituteId)),
  ).map((restriction) => summarizeGlobalRestriction(restriction));

  const traineeRestrictions = activeTraineeRestrictions()
    .filter(
      (restriction) =>
        restriction.traineeId === traineeId && restriction.phoneNumber === phoneNumber && restriction.endDate >= today,
    )
    .map((restriction) => summarizeTraineeRestriction(restriction));

  return [...globalRestrictions, ...traineeRestrictions]
    .map((restriction) => ({
      ...restriction,
      existingTraineePermits: activePermitsOn(traineeId, restriction.restrictionId, today),
    }))
    .sort(
      (first, second) =>
        SCOPE_ORDER[first.scope] - SCOPE_ORDER[second.scope] || first.startDate.localeCompare(second.startDate),
    );
}

/** ההיתרים של החניך על ההגבלה שלא הסתיימו - מוצגים כדי לעזור להימנע מכפילויות */
function activePermitsOn(traineeId: number, restrictionId: number, today: ISODateString): ExistingPermitBriefDto[] {
  return activePermits()
    .filter(
      (permit) =>
        permit.traineeId === traineeId &&
        permit.sourceRestriction.restrictionId === restrictionId &&
        permit.endDate >= today,
    )
    .map((permit) => ({
      permitId: permit.id,
      startDate: permit.startDate,
      endDate: permit.endDate,
      durationMinutes: permit.durationMinutes,
      startTime: permit.startTime,
      endTime: permit.endTime,
      devices: permit.devices,
    }));
}

// ── שמירת הגבלה (ספק 04 overview §2.4) ──

export function handleCreateTraineePhoneRestriction(request: MockRequest): CreateTraineePhoneRestrictionResponse {
  const input = request.body as CreateTraineePhoneRestrictionRequest;
  throwIfInvalid(
    { ...validatePhoneNumbers(input.phoneNumbers), ...validateConditionsAndDecision(input) },
    INVALID_INPUT_MESSAGE,
  );

  // כל מספר נשמר כהגבלה נפרדת, עם אותם תאריכים, תנאים והחלטה
  const records = input.traineeIds.flatMap((traineeId) =>
    input.phoneNumbers.map((phoneNumber) => {
      const record = buildPhoneRestrictionRecord(input, {
        id: nextPhoneRecordId("restriction"),
        restrictionNumberId: nextRestrictionNumberId(),
        traineeId,
        phoneNumber,
      });
      TRAINEE_PHONE_RECORDS_MOCK_DATA.push(record);
      return record;
    }),
  );
  return toMutationResult(records);
}

export function handleUpdateTraineePhoneRestriction(request: MockRequest): UpdateTraineePhoneRestrictionResponse {
  const input = request.body as UpdateTraineePhoneRestrictionRequest;
  const previous = findReplaceableRestriction(input.previousId);
  throwIfInvalid(validateConditionsAndDecision(input), INVALID_INPUT_MESSAGE);

  // המספר נעול בעריכה. מזהה טבלת האב נשמר, כדי שההיתרים שעל ההגבלה יישארו מחוברים אליה
  previous.isActive = false;
  const record = buildPhoneRestrictionRecord(input, {
    id: nextPhoneRecordId("restriction"),
    restrictionNumberId: previous.restrictionNumberId,
    traineeId: previous.traineeId,
    phoneNumber: previous.phoneNumber,
    phoneNumberId: previous.phoneNumberId,
  });
  TRAINEE_PHONE_RECORDS_MOCK_DATA.push(record);
  return toMutationResult([record]);
}

function validatePhoneNumbers(phoneNumbers: PhoneString[]): Record<string, string> {
  if (phoneNumbers.length === 0) {
    return { phoneNumbers: PHONE_VALIDATION_MESSAGES.required };
  }
  if (!phoneNumbers.every(isValidPhone)) {
    return { phoneNumbers: PHONE_VALIDATION_MESSAGES.invalid };
  }
  return {};
}

function findReplaceableRestriction(recordId: number): TraineePhoneRestrictionRecordDto {
  const previous = TRAINEE_PHONE_RECORDS_MOCK_DATA.find(
    (record): record is TraineePhoneRestrictionRecordDto => record.type === "restriction" && record.id === recordId,
  );
  if (!previous) {
    throwNotFound(`No trainee phone restriction ${recordId}`);
  }
  if (!previous.isActive) {
    throwConflict(`Trainee phone restriction ${recordId} was already replaced`);
  }
  throwIfEnded(previous, `Trainee phone restriction ${recordId}`);
  return previous;
}

// ── שמירת היתר (ספק 04 overview §2.3) ──

export function handleCreateTraineePhonePermit(request: MockRequest): CreateTraineePhonePermitResponse {
  const input = request.body as CreateTraineePhonePermitRequest;
  const today = todayIsoDate();

  const records = input.traineeIds.map((traineeId) => {
    // ההגבלה שנבחרה הסתיימה או כבר לא חלה על החניך מאז החיפוש
    const sourceRestriction = findSourceRestrictionForTrainee(input.sourceRestrictionId, traineeId);
    if (!sourceRestriction || sourceRestriction.endDate < today) {
      throwConflict(`Restriction ${input.sourceRestrictionId} is no longer active for trainee ${traineeId}`);
    }
    throwIfInvalid(
      { ...validateConditionsAndDecision(input), ...validatePermitDates(input, sourceRestriction) },
      INVALID_INPUT_MESSAGE,
    );
    return buildPermitRecord(input, { id: nextPhoneRecordId("permit"), traineeId, sourceRestriction });
  });

  TRAINEE_PHONE_RECORDS_MOCK_DATA.push(...records);
  return toMutationResult(records);
}

export function handleUpdateTraineePhonePermit(request: MockRequest): UpdateTraineePhonePermitResponse {
  const input = request.body as UpdateTraineePhonePermitRequest;
  const previous = findReplaceablePermit(input.previousPermitId);
  // ההיתר עצמו פעיל (נבדק למעלה); אם ההגבלה כבר לא קיימת - העותק שנשמר עם ההיתר
  const sourceRestriction = findSourceRestriction(input.sourceRestrictionId) ?? previous.sourceRestriction;
  throwIfInvalid(
    { ...validateConditionsAndDecision(input), ...validatePermitDates(input, sourceRestriction) },
    INVALID_INPUT_MESSAGE,
  );

  previous.isActive = false;
  const record = buildPermitRecord(input, {
    id: nextPhoneRecordId("permit"),
    traineeId: previous.traineeId,
    sourceRestriction,
  });
  TRAINEE_PHONE_RECORDS_MOCK_DATA.push(record);
  return toMutationResult([record]);
}

/** תאריכי ההיתר בתוך תקופת ההגבלה (ספק 04 form §5) */
function validatePermitDates(
  input: { startDate: ISODateString; endDate: ISODateString },
  sourceRestriction: SourceRestrictionSummaryDto,
): Record<string, string> {
  const isInsideRestriction =
    input.startDate >= sourceRestriction.startDate && input.endDate <= sourceRestriction.endDate;
  if (isInsideRestriction) return {};
  const range = formatDateRange(sourceRestriction.startDate, sourceRestriction.endDate);
  return { startDate: PHONE_VALIDATION_MESSAGES.permitOutsideRestriction(range) };
}

function findReplaceablePermit(recordId: number): TraineePhonePermitRecordDto {
  const previous = allPermits().find((permit) => permit.id === recordId);
  if (!previous) {
    throwNotFound(`No trainee phone permit ${recordId}`);
  }
  if (!previous.isActive) {
    throwConflict(`Trainee phone permit ${recordId} was already replaced`);
  }
  throwIfEnded(previous, `Trainee phone permit ${recordId}`);
  return previous;
}

// ── הגבלות המקור ──

/** ההגבלה (ארצית, פנימייתית או של חניך) לפי המזהה שלה בטבלת האב, כמו שהיא עכשיו */
function findSourceRestriction(restrictionId: number): SourceRestrictionSummaryDto | null {
  const globalRestriction = GLOBAL_PHONE_RESTRICTIONS_MOCK_DATA.find(
    (restriction) => restriction.isActive && restriction.id === restrictionId,
  );
  if (globalRestriction) {
    return summarizeGlobalRestriction(globalRestriction);
  }
  const traineeRestriction = activeTraineeRestrictions().find(
    (restriction) => restriction.restrictionNumberId === restrictionId,
  );
  return traineeRestriction ? summarizeTraineeRestriction(traineeRestriction) : null;
}

/** ההגבלה, רק אם היא חלה על החניך: ארצית, של הפנימייה שלו, או שנוצרה לו */
function findSourceRestrictionForTrainee(restrictionId: number, traineeId: number): SourceRestrictionSummaryDto | null {
  const sourceRestriction = findSourceRestriction(restrictionId);
  const trainee = TRAINEES_MOCK_DATA.find((candidate) => candidate.id === traineeId);
  if (!sourceRestriction || !trainee) return null;

  switch (sourceRestriction.scope) {
    case "national":
      return sourceRestriction;
    case "institute":
      return sourceRestriction.institutes.some((institute) => institute.id === trainee.instituteId)
        ? sourceRestriction
        : null;
    case "trainee": {
      const isOwnRestriction = activeTraineeRestrictions().some(
        (restriction) => restriction.restrictionNumberId === restrictionId && restriction.traineeId === traineeId,
      );
      return isOwnRestriction ? sourceRestriction : null;
    }
  }
}

function activeTraineeRestrictions(): TraineePhoneRestrictionRecordDto[] {
  return TRAINEE_PHONE_RECORDS_MOCK_DATA.filter(
    (record): record is TraineePhoneRestrictionRecordDto => record.type === "restriction" && record.isActive,
  );
}

function allPermits(): TraineePhonePermitRecordDto[] {
  return TRAINEE_PHONE_RECORDS_MOCK_DATA.filter(
    (record): record is TraineePhonePermitRecordDto => record.type === "permit",
  );
}

function activePermits(): TraineePhonePermitRecordDto[] {
  return allPermits().filter((permit) => permit.isActive);
}

// ── בניית הרשומות ──

// מזהי מספרי טלפון חדשים (AVIV_PHONE_NUMBERS), אחרי אלה שבמוק
const NEW_PHONE_NUMBER_ID_BASE = 7500;
const INLINE_PERMIT_ID_OFFSET = 500;

/** לכל טבלה רצף מזהים משלה */
function nextPhoneRecordId(type: TraineePhoneRecordDto["type"]): number {
  return nextRecordId(TRAINEE_PHONE_RECORDS_MOCK_DATA.filter((record) => record.type === type));
}

/** הגבלות הארציות והפנימייתיות וההגבלות של החניכים נמצאות באותה טבלת אב (AVIV_RESTRICTION_NUMBER) */
function nextRestrictionNumberId(): number {
  const usedIds = [
    ...GLOBAL_PHONE_RESTRICTIONS_MOCK_DATA.map((restriction) => restriction.id),
    ...TRAINEE_PHONE_RECORDS_MOCK_DATA.filter(
      (record): record is TraineePhoneRestrictionRecordDto => record.type === "restriction",
    ).map((restriction) => restriction.restrictionNumberId),
  ];
  return Math.max(0, ...usedIds) + 1;
}

/** מספר שכבר קיים במערכת שומר על המזהה שלו; מספר חדש מקבל מזהה חדש */
function phoneNumberIdOf(phoneNumber: PhoneString): number {
  const knownNumbers = [...GLOBAL_PHONE_RESTRICTIONS_MOCK_DATA, ...TRAINEE_PHONE_RECORDS_MOCK_DATA];
  const knownNumber = knownNumbers.find((record) => record.phoneNumber === phoneNumber);
  if (knownNumber) return knownNumber.phoneNumberId;
  return Math.max(NEW_PHONE_NUMBER_ID_BASE, ...knownNumbers.map((record) => record.phoneNumberId)) + 1;
}

interface PhoneRestrictionIdentity {
  id: number;
  restrictionNumberId: number;
  traineeId: number;
  phoneNumber: PhoneString;
  /** בעריכה - המזהה של המספר הנעול */
  phoneNumberId?: number;
}

function hasInlinePermit(input: ConditionsAndDecisionInput): boolean {
  return (
    input.durationMinutes !== null || input.startTime !== null || input.endTime !== null || input.deviceIds.length > 0
  );
}

function buildPhoneRestrictionRecord(
  input: ConditionsAndDecisionInput,
  identity: PhoneRestrictionIdentity,
): TraineePhoneRestrictionRecordDto {
  return {
    type: "restriction",
    id: identity.id,
    restrictionNumberId: identity.restrictionNumberId,
    // משך, שעות או מכשירים נשמרים כשורת היתר צמודה להגבלה
    inlinePermitId: hasInlinePermit(input) ? identity.restrictionNumberId + INLINE_PERMIT_ID_OFFSET : null,
    traineeId: identity.traineeId,
    phoneNumberId: identity.phoneNumberId ?? phoneNumberIdOf(identity.phoneNumber),
    phoneNumber: identity.phoneNumber,
    ...buildDatesAndConditions(input),
    ...decisionFromInput(input),
    ...buildAuditMetadata(input.startDate, input.endDate, 0, MOCK_CURRENT_USER_ID),
  };
}

interface PermitIdentity {
  id: number;
  traineeId: number;
  sourceRestriction: SourceRestrictionSummaryDto;
}

function buildPermitRecord(input: ConditionsAndDecisionInput, identity: PermitIdentity): TraineePhonePermitRecordDto {
  const { sourceRestriction } = identity;
  return {
    type: "permit",
    id: identity.id,
    traineeId: identity.traineeId,
    // המספר נגזר מההגבלה שעליה חל ההיתר (ספק 04 form §6.1)
    phoneNumberId: sourceRestriction.phoneNumberId,
    phoneNumber: sourceRestriction.phoneNumber,
    sourceRestriction: { ...sourceRestriction, existingTraineePermits: [] },
    ...buildDatesAndConditions(input),
    ...decisionFromInput(input),
    ...buildAuditMetadata(input.startDate, input.endDate, 0, MOCK_CURRENT_USER_ID),
  };
}

type DatesAndConditions = PermittedCallConditionsDto & { startDate: ISODateString; endDate: ISODateString };

function buildDatesAndConditions(input: ConditionsAndDecisionInput): DatesAndConditions {
  return {
    startDate: input.startDate,
    endDate: input.endDate,
    durationMinutes: input.durationMinutes,
    startTime: input.startTime,
    endTime: input.endTime,
    devices: devicesFromIds(input.deviceIds),
  };
}
