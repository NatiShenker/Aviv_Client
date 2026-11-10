import type { ISODateString, PhoneString } from "@/types/common.schema";
import {
  RESTRICTION_SCOPE_CODE,
  type CreateTraineePhonePermitRequest,
  type CreateTraineePhonePermitResponse,
  type CreateTraineePhoneRestrictionRequest,
  type CreateTraineePhoneRestrictionResponse,
  type ExistingPermitDto,
  type GetTraineePhoneRecordsRequest,
  type GetTraineePhoneRecordsResponse,
  type LookupPhoneRestrictionsForPermitRequest,
  type LookupPhoneRestrictionsForPermitResponse,
  type PhonePermitSaveFields,
  type PhoneRestrictionSaveFields,
  type SourceRestrictionSummaryDto,
  type TraineePhonePermitRecordDto,
  type TraineePhoneRecordDto,
  type TraineePhoneRestrictionRecordDto,
  type UpdateTraineePhonePermitRequest,
  type UpdateTraineePhonePermitResponse,
  type UpdateTraineePhoneRestrictionRequest,
  type UpdateTraineePhoneRestrictionResponse,
} from "@/types/phone-exceptions.schema";
import { GLOBAL_PHONE_RESTRICTIONS_MOCK_DATA } from "../data/globalPhoneRestrictionsMockData";
import { buildAuditMetadata } from "../data/recordMetadataBuilders";
import { summarizeGlobalRestriction, summarizeTraineeRestriction } from "../data/sourceRestrictionBuilders";
import { activeRecords, toRecordDto, type StoredRecord } from "../data/storedRecords";
import { TRAINEE_PHONE_RECORDS_MOCK_DATA } from "../data/traineePhoneRecordsMockData";
import { TRAINEES_MOCK_DATA } from "../data/traineesMockData";
import { hasEnded } from "../mockDates";
import { throwConflictError, type MockRequest } from "../mockRequest";
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
  normalizeDistinctPhoneNumbers,
  requireDateRange,
  requireIdList,
  requirePhoneNumberList,
  requirePositive,
  requirePositiveWhenPresent,
  throwIfInvalid,
  type FailedField,
} from "./recordInputValidation";

/*
 * "הגבלות והיתרים למספר" (ספק 04), כמו PhoneExceptionsController והפרוצדורות שלו: רשומות החניך, איתור ההגבלות
 * ליצירת היתר, ושמירה של הגבלות והיתרים. עדכון לא משנה רשומה - הקודמת נכבית (LOGI_ACTIVE = 0) ונוספת רשומה
 * פעילה חדשה (D-1). השגיאות העסקיות הן של השרת: 400 עם שם השדה, 409 כשהרשומה שמפנים אליה כבר אינה תקפה (A-2).
 */

type StoredRestriction = StoredRecord<TraineePhoneRestrictionRecordDto>;
type StoredPermit = StoredRecord<TraineePhonePermitRecordDto>;

// ── שליפת הרשומות (ספק 04 history §6, B-5) ──

export function handleGetTraineePhoneRecords(request: MockRequest): GetTraineePhoneRecordsResponse {
  const { idntTraineeList } = request.body as GetTraineePhoneRecordsRequest;
  throwIfInvalid(requireIdList(idntTraineeList, SERVER_FIELDS.idntTraineeList));

  const records = activeRecords(TRAINEE_PHONE_RECORDS_MOCK_DATA)
    .filter((record) => idntTraineeList.includes(record.idntTrainee))
    .map(toRecordDto)
    .map(withCurrentSourceRestriction);
  return { records };
}

// "חל על הגבלה" מוצג מההגבלה כפי שהיא עכשיו (JOIN לטבלת האב), ולא מהעותק שנשמר עם ההיתר (ספק 04 overview §2.3).
// ההיתרים הקיימים אינם ממולאים בהיסטוריה (02-architecture.md §8)
function withCurrentSourceRestriction(record: TraineePhoneRecordDto): TraineePhoneRecordDto {
  if (!record.isPermit) return record;
  const currentRestriction = findSourceRestriction(record.idntAvivRestrictionNumber);
  return currentRestriction ? { ...record, sourceRestriction: currentRestriction } : record;
}

// ── איתור ההגבלות ליצירת היתר (ספק 04 overview §2.7) ──

export function handleLookupPhoneRestrictionsForPermit(request: MockRequest): LookupPhoneRestrictionsForPermitResponse {
  const { idntTrainee, idntInstitution, phoneNumberList } = request.body as LookupPhoneRestrictionsForPermitRequest;
  throwIfInvalid(
    requirePositive(idntTrainee, SERVER_FIELDS.idntTrainee) ??
      requirePositive(idntInstitution, SERVER_FIELDS.idntInstitution) ??
      requirePhoneNumberList(phoneNumberList),
  );

  // תוצאה לכל מספר, בסדר הבקשה, עם המספר המנורמל (A-9, I-4)
  return {
    results: normalizeDistinctPhoneNumbers(phoneNumberList).map((textPhoneNumber) => ({
      textPhoneNumber,
      activeRestrictions: findApplicableRestrictions(idntTrainee, idntInstitution, textPhoneNumber),
    })),
  };
}

/** הגבלות שלא הסתיימו: כלליות בלי צמצום, כלליות המצומצמות לפנימיית החניך, ושל החניך עצמו (A-5) */
function findApplicableRestrictions(
  idntTrainee: number,
  idntInstitution: number,
  textPhoneNumber: PhoneString,
): SourceRestrictionSummaryDto[] {
  const generalRestrictions = currentGlobalRestrictions()
    .filter(
      (restriction) =>
        restriction.textPhoneNumber === textPhoneNumber &&
        (restriction.institutes.length === 0 || isLinkedToInstitute(restriction.institutes, idntInstitution)),
    )
    .map((restriction) => summarizeGlobalRestriction(restriction));

  const traineeRestrictions = currentTraineeRestrictions()
    .filter(
      (restriction) => restriction.idntTrainee === idntTrainee && restriction.textPhoneNumber === textPhoneNumber,
    )
    .map((restriction) => summarizeTraineeRestriction(restriction));

  // המיון של PhoneRecordsAssembler: קוד ה-scope (כללית לפני חניך), בלי פנימיות (ארצית) לפני עם פנימיות, ואז תאריך ההתחלה
  return [...generalRestrictions, ...traineeRestrictions]
    .map((restriction) => ({
      ...restriction,
      existingTraineePermits: currentPermitsOn(idntTrainee, restriction.idntAvivRestrictionNumber),
    }))
    .sort(
      (first, second) =>
        first.codeRestrictionScope - second.codeRestrictionScope ||
        Number(first.institutes.length > 0) - Number(second.institutes.length > 0) ||
        first.dateStart.localeCompare(second.dateStart),
    );
}

function isLinkedToInstitute(institutes: { id: number }[], idntInstitution: number): boolean {
  return institutes.some((institute) => institute.id === idntInstitution);
}

/** ההיתרים של החניך על ההגבלה שלא הסתיימו - מוצגים כדי לעזור להימנע מכפילויות */
function currentPermitsOn(idntTrainee: number, idntAvivRestrictionNumber: number): ExistingPermitDto[] {
  return activePermits()
    .filter(
      (permit) =>
        permit.idntTrainee === idntTrainee &&
        permit.idntAvivRestrictionNumber === idntAvivRestrictionNumber &&
        !hasEnded(permit.dateEnd),
    )
    .map((permit) => ({
      id: permit.id,
      dateStart: permit.dateStart,
      dateEnd: permit.dateEnd,
      numbDurationLimit: permit.numbDurationLimit,
      timePermitStart: permit.timePermitStart,
      timePermitEnd: permit.timePermitEnd,
      idntDeviceList: permit.idntDeviceList,
    }));
}

// ── שמירת הגבלה (ספק 04 overview §2.4) ──

export function handleCreateTraineePhoneRestriction(request: MockRequest): CreateTraineePhoneRestrictionResponse {
  const input = request.body as CreateTraineePhoneRestrictionRequest;
  throwIfInvalid(
    requireIdList(input.idntTraineeList, SERVER_FIELDS.idntTraineeList) ??
      requirePhoneNumberList(input.phoneNumberList) ??
      checkRestrictionFields(input),
  );

  // רשומה לכל זוג חניך × מספר, עם אותם תאריכים, תנאים ואישור (P-12); שורת קובץ אחת לכל השמירה (D-13)
  const fileId = allocateFileId();
  const records = input.idntTraineeList.flatMap((idntTrainee) =>
    normalizeDistinctPhoneNumbers(input.phoneNumberList).map((textPhoneNumber) => {
      const record = buildPhoneRestrictionRecord(input, {
        id: nextPhoneRecordId(false),
        idntAvivRestrictionNumber: nextRestrictionNumberId(),
        idntTrainee,
        idntAvivListPhoneNumber: phoneNumberIdOf(textPhoneNumber),
        textPhoneNumber,
        fileId,
      });
      TRAINEE_PHONE_RECORDS_MOCK_DATA.push(record);
      return record;
    }),
  );
  return toMutationResult(records.map((record) => record.id));
}

export function handleUpdateTraineePhoneRestriction(request: MockRequest): UpdateTraineePhoneRestrictionResponse {
  const input = request.body as UpdateTraineePhoneRestrictionRequest;
  throwIfInvalid(requirePositive(input.idntPrevious, SERVER_FIELDS.idntPrevious) ?? checkRestrictionFields(input));

  // תפיסת הגרסה הקודמת (409); המספר והחניך נלקחים ממנה ולא מהבקשה
  const previous = findReplaceableRecord(allRestrictions(), input.idntPrevious);
  previous.isActive = false;

  // D-1: גרסה חדשה = אב חדש ב-AVIV_RESTRICTION_NUMBER, וההיתרים הפעילים שעל האב הקודם מוצבעים מחדש אליו
  const record = buildPhoneRestrictionRecord(input, {
    id: nextPhoneRecordId(false),
    idntAvivRestrictionNumber: nextRestrictionNumberId(),
    idntTrainee: previous.idntTrainee,
    idntAvivListPhoneNumber: previous.idntAvivListPhoneNumber,
    textPhoneNumber: previous.textPhoneNumber,
    fileId: allocateFileId(),
  });
  TRAINEE_PHONE_RECORDS_MOCK_DATA.push(record);
  repointActivePermits(previous.idntAvivRestrictionNumber, record);
  return toMutationResult([record.id]);
}

/** D-1: ההיתרים הפעילים של ההגבלה עוברים לגרסת האב החדשה, ו"חל על הגבלה" שלהם מתעדכן */
function repointActivePermits(previousRestrictionNumberId: number, newRestriction: StoredRestriction): void {
  const newSummary = summarizeTraineeRestriction(newRestriction);
  activePermits()
    .filter((permit) => permit.idntAvivRestrictionNumber === previousRestrictionNumberId)
    .forEach((permit) => {
      permit.idntAvivRestrictionNumber = newRestriction.idntAvivRestrictionNumber;
      permit.sourceRestriction = newSummary;
    });
}

// ── שמירת היתר (ספק 04 overview §2.3) ──

export function handleCreateTraineePhonePermit(request: MockRequest): CreateTraineePhonePermitResponse {
  const input = request.body as CreateTraineePhonePermitRequest;
  throwIfInvalid(
    requireIdList(input.idntTraineeList, SERVER_FIELDS.idntTraineeList) ??
      requirePositiveWhenPresent(input.idntInstitution, SERVER_FIELDS.idntInstitution) ??
      requirePositive(input.idntAvivRestrictionNumber, SERVER_FIELDS.idntAvivRestrictionNumber) ??
      checkPermitFields(input),
  );

  // הבדיקות של הפרוצדורה: ההגבלה פעילה ולא הסתיימה, חלה על החניכים (409), והתאריכים בתוכה (400)
  const sourceRestriction = findSourceRestriction(input.idntAvivRestrictionNumber);
  if (!sourceRestriction || !appliesToTrainees(sourceRestriction, input.idntTraineeList, input.idntInstitution)) {
    throwConflictError(SERVER_FIELDS.idntAvivRestrictionNumber);
  }
  throwIfInvalid(checkPermitDatesInsideRestriction(input, sourceRestriction));

  const fileId = allocateFileId();
  const records = input.idntTraineeList.map((idntTrainee) => {
    const record = buildPermitRecord(input, { id: nextPhoneRecordId(true), idntTrainee, sourceRestriction, fileId });
    TRAINEE_PHONE_RECORDS_MOCK_DATA.push(record);
    return record;
  });
  return toMutationResult(records.map((record) => record.id));
}

export function handleUpdateTraineePhonePermit(request: MockRequest): UpdateTraineePhonePermitResponse {
  const input = request.body as UpdateTraineePhonePermitRequest;
  throwIfInvalid(requirePositive(input.idntPrevious, SERVER_FIELDS.idntPrevious) ?? checkPermitFields(input));

  // תפיסת ההיתר הקודם (409 idntPrevious); ההגבלה והחניך נלקחים ממנו ולא מהבקשה (D-1)
  const previous = findReplaceableRecord(allPermits(), input.idntPrevious);

  // B-3: הגבלה שהסתיימה (או הוחלפה בלי הצבעה מחדש) - 409; התאריכים בתוך ההגבלה - 400
  const sourceRestriction = findSourceRestriction(previous.idntAvivRestrictionNumber);
  if (!sourceRestriction) {
    throwConflictError(SERVER_FIELDS.idntAvivRestrictionNumber);
  }
  throwIfInvalid(checkPermitDatesInsideRestriction(input, sourceRestriction));

  previous.isActive = false;
  const record = buildPermitRecord(input, {
    id: nextPhoneRecordId(true),
    idntTrainee: previous.idntTrainee,
    sourceRestriction,
    fileId: allocateFileId(),
  });
  TRAINEE_PHONE_RECORDS_MOCK_DATA.push(record);
  return toMutationResult([record.id]);
}

/**
 * ההגבלה חלה על החניכים: כללית בלי צמצום; כללית מצומצמת - רק עם קישור לפנימייה שנשלחה (null מדלג, C-6);
 * של חניך - רק אם כל החניכים הם החניך שלה (I-3)
 */
function appliesToTrainees(
  sourceRestriction: SourceRestrictionSummaryDto,
  idntTraineeList: number[],
  idntInstitution: number | null,
): boolean {
  if (sourceRestriction.codeRestrictionScope === RESTRICTION_SCOPE_CODE.trainee) {
    return idntTraineeList.every((idntTrainee) =>
      currentTraineeRestrictions().some(
        (restriction) =>
          restriction.idntAvivRestrictionNumber === sourceRestriction.idntAvivRestrictionNumber &&
          restriction.idntTrainee === idntTrainee,
      ),
    );
  }
  const isNarrowedToInstitutes = sourceRestriction.institutes.length > 0;
  if (!isNarrowedToInstitutes || idntInstitution === null) return true;
  return isLinkedToInstitute(sourceRestriction.institutes, idntInstitution);
}

/** ספק 04 §2.3: תאריכי ההיתר בתוך תקופת ההגבלה; השרת מחזיר את השדה datePermitStart */
function checkPermitDatesInsideRestriction(
  input: { datePermitStart: ISODateString; datePermitEnd: ISODateString },
  sourceRestriction: SourceRestrictionSummaryDto,
): FailedField {
  const isInsideRestriction =
    input.datePermitStart >= sourceRestriction.dateStart && input.datePermitEnd <= sourceRestriction.dateEnd;
  return isInsideRestriction ? null : SERVER_FIELDS.datePermitStart;
}

// ── אימות (PhoneExceptionsRequestValidator) ──

function checkRestrictionFields(input: PhoneRestrictionSaveFields): FailedField {
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

function checkPermitFields(input: PhonePermitSaveFields): FailedField {
  return (
    requireDateRange(
      input.datePermitStart,
      input.datePermitEnd,
      SERVER_FIELDS.datePermitStart,
      SERVER_FIELDS.datePermitEnd,
    ) ??
    checkConditions(input) ??
    checkApproval(
      input.textPermitReason,
      SERVER_FIELDS.textPermitReason,
      input.codePermitReason,
      SERVER_FIELDS.codePermitReason,
      input,
    )
  );
}

// ── הגבלות המקור ──

/** ההגבלה (ארצית, פנימייתית או של חניך) לפי המזהה שלה בטבלת האב, כמו שהיא עכשיו - רק פעילה ושלא הסתיימה */
function findSourceRestriction(idntAvivRestrictionNumber: number): SourceRestrictionSummaryDto | null {
  const globalRestriction = currentGlobalRestrictions().find((restriction) => restriction.id === idntAvivRestrictionNumber);
  if (globalRestriction) {
    return summarizeGlobalRestriction(globalRestriction);
  }
  const traineeRestriction = currentTraineeRestrictions().find(
    (restriction) => restriction.idntAvivRestrictionNumber === idntAvivRestrictionNumber,
  );
  return traineeRestriction ? summarizeTraineeRestriction(traineeRestriction) : null;
}

/** ההגבלות הכלליות הפעילות שלא הסתיימו */
function currentGlobalRestrictions() {
  return activeRecords(GLOBAL_PHONE_RESTRICTIONS_MOCK_DATA).filter((restriction) => !hasEnded(restriction.dateEnd));
}

/** הגבלות החניכים הפעילות שלא הסתיימו */
function currentTraineeRestrictions(): StoredRestriction[] {
  return activeRecords(allRestrictions()).filter((restriction) => !hasEnded(restriction.dateEnd));
}

function allRestrictions(): StoredRestriction[] {
  return TRAINEE_PHONE_RECORDS_MOCK_DATA.filter((record): record is StoredRestriction => !record.isPermit);
}

function allPermits(): StoredPermit[] {
  return TRAINEE_PHONE_RECORDS_MOCK_DATA.filter((record): record is StoredPermit => record.isPermit);
}

function activePermits(): StoredPermit[] {
  return activeRecords(allPermits());
}

// ── בניית הרשומות ──

// מזהי מספרי טלפון חדשים (AVIV_LIST_PHONE_NUMBER), אחרי אלה שבמוק
const NEW_PHONE_NUMBER_ID_BASE = 7500;

/** לכל טבלה רצף מזהים משלה: שורות החניך של ההגבלות, וההיתרים */
function nextPhoneRecordId(isPermit: boolean): number {
  return nextRecordId(TRAINEE_PHONE_RECORDS_MOCK_DATA.filter((record) => record.isPermit === isPermit));
}

/** ההגבלות הארציות והפנימייתיות והגבלות החניכים נמצאות באותה טבלת אב (AVIV_RESTRICTION_NUMBER) */
function nextRestrictionNumberId(): number {
  const usedIds = [
    ...GLOBAL_PHONE_RESTRICTIONS_MOCK_DATA.map((restriction) => restriction.id),
    ...allRestrictions().map((restriction) => restriction.idntAvivRestrictionNumber),
  ];
  return Math.max(0, ...usedIds) + 1;
}

/** מספר שכבר קיים במילון המספרים שומר על המזהה שלו; מספר חדש מקבל מזהה חדש (get-or-create בפרוצדורה) */
function phoneNumberIdOf(textPhoneNumber: PhoneString): number {
  const knownNumbers = [...GLOBAL_PHONE_RESTRICTIONS_MOCK_DATA, ...TRAINEE_PHONE_RECORDS_MOCK_DATA];
  const knownNumber = knownNumbers.find((record) => record.textPhoneNumber === textPhoneNumber);
  if (knownNumber) return knownNumber.idntAvivListPhoneNumber;
  return Math.max(NEW_PHONE_NUMBER_ID_BASE, ...knownNumbers.map((record) => record.idntAvivListPhoneNumber)) + 1;
}

interface PhoneRestrictionIdentity {
  id: number;
  idntAvivRestrictionNumber: number;
  idntTrainee: number;
  idntAvivListPhoneNumber: number;
  textPhoneNumber: PhoneString;
  fileId: number;
}

// codeRestrictionReason מתקבל ולא נשמר, כמו בפרוצדורה (I-23)
function buildPhoneRestrictionRecord(input: PhoneRestrictionSaveFields, identity: PhoneRestrictionIdentity): StoredRestriction {
  return {
    isPermit: false,
    id: identity.id,
    idntAvivRestrictionNumber: identity.idntAvivRestrictionNumber,
    idntTrainee: identity.idntTrainee,
    idntAvivListPhoneNumber: identity.idntAvivListPhoneNumber,
    textPhoneNumber: identity.textPhoneNumber,
    dateStart: input.dateRestrictionStart,
    dateEnd: input.dateRestrictionEnd,
    sourceRestriction: null,
    ...conditionsFromInput(input),
    ...decisionFromInput(input.textRestrictionReason, input, identity.fileId),
    ...buildAuditMetadata(input.dateRestrictionEnd, 0, MOCK_CURRENT_USER_ID),
    isActive: true,
  };
}

interface PermitIdentity {
  id: number;
  idntTrainee: number;
  sourceRestriction: SourceRestrictionSummaryDto;
  fileId: number;
}

// codePermitReason מתקבל ולא נשמר, כמו בפרוצדורה (I-23)
function buildPermitRecord(input: PhonePermitSaveFields, identity: PermitIdentity): StoredPermit {
  const { sourceRestriction } = identity;
  return {
    isPermit: true,
    id: identity.id,
    idntAvivRestrictionNumber: sourceRestriction.idntAvivRestrictionNumber,
    idntTrainee: identity.idntTrainee,
    // המספר נגזר מההגבלה שעליה חל ההיתר (ספק 04 form §6.1)
    idntAvivListPhoneNumber: sourceRestriction.idntAvivListPhoneNumber,
    textPhoneNumber: sourceRestriction.textPhoneNumber,
    dateStart: input.datePermitStart,
    dateEnd: input.datePermitEnd,
    sourceRestriction: { ...sourceRestriction, existingTraineePermits: [] },
    ...conditionsFromInput(input),
    ...decisionFromInput(input.textPermitReason, input, identity.fileId),
    ...buildAuditMetadata(input.datePermitEnd, 0, MOCK_CURRENT_USER_ID),
    isActive: true,
  };
}

// E-8: הרשומה מחזיקה את מזהי המכשירים כפי שנשלחו (אחרי הסרת כפילויות באימות), כמו AVIV_PERMITS_DEVICE
function conditionsFromInput(input: PhoneRestrictionSaveFields | PhonePermitSaveFields) {
  return {
    numbDurationLimit: input.numbDurationLimit,
    timePermitStart: input.timePermitStart,
    timePermitEnd: input.timePermitEnd,
    idntDeviceList: input.idntDeviceList,
  };
}
