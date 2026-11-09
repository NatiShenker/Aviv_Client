import type { PhoneString } from "@/types/common.schema";
import type {
  CreateTraineeVoiceMessageRequest,
  CreateTraineeVoiceMessageResponse,
  GetTraineeVoiceMessagesRequest,
  GetTraineeVoiceMessagesResponse,
  TraineeVoiceMessageRecordDto,
  UpdateTraineeVoiceMessageRequest,
  UpdateTraineeVoiceMessageResponse,
  VoiceMessageDecisionInput,
  VoiceMessageScope,
} from "@/types/voice-messages.schema";
import { isValidPhone } from "@/utils/phone";
import { buildAuditMetadata } from "../data/recordMetadataBuilders";
import { activeRecords, toRecordDto, type StoredRecord } from "../data/storedRecords";
import { TRAINEE_VOICE_MESSAGES_MOCK_DATA } from "../data/traineeVoiceMessagesMockData";
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
  DETAILS_MAX_LENGTH,
  checkApproverAndFile,
  requireDateRange,
  requireText,
  throwIfInvalid,
  type FailedField,
} from "./recordInputValidation";

/*
 * "הודעה קולית לנמען" (ספק 05): ההודעות של החניך ושמירתן. הסרביס של 05 עוד לא הוגדר, ולכן שמות השדות של 05
 * הם כפי שנוסחו בקליינט; החלקים המשותפים (audit, אישור, תוצאת שמירה, שגיאות) כמו ב-03/04.
 * כמו בשרת: עדכון לא משנה רשומה - הקודמת נכבית (LOGI_ACTIVE = 0) ונוספת רשומה פעילה חדשה.
 */

// שמות השדות של 05 בבקשות, כפי שנוסחו בקליינט
const VOICE_MESSAGE_FIELDS = {
  phoneNumbers: "phoneNumbers",
  startDate: "startDate",
  endDate: "endDate",
  reason: "reason",
  details: "details",
} as const;

// מזהי מספרי טלפון חדשים, אחרי אלה שבמוק
const NEW_PHONE_NUMBER_ID_BASE = 7900;

// ── שליפה (ספק 05 history §6) ──

export function handleGetTraineeVoiceMessages(request: MockRequest): GetTraineeVoiceMessagesResponse {
  const { traineeIds } = request.body as GetTraineeVoiceMessagesRequest;

  const records = activeRecords(TRAINEE_VOICE_MESSAGES_MOCK_DATA)
    .filter((record) => traineeIds.includes(record.traineeId))
    .map(toRecordDto);
  return { records };
}

// ── יצירה (ספק 05 overview §2) ──

export function handleCreateTraineeVoiceMessage(request: MockRequest): CreateTraineeVoiceMessageResponse {
  const input = request.body as CreateTraineeVoiceMessageRequest;
  throwIfInvalid(checkPhoneNumbers(input.scope, input.phoneNumbers) ?? checkDatesAndDecision(input));

  // בכל השיחות - רשומה אחת בלי מספר; במספרים נבחרים - רשומה נפרדת לכל מספר
  const phoneNumbers: (PhoneString | null)[] = input.scope === "all" ? [null] : input.phoneNumbers;
  const fileId = allocateFileId();
  const records = input.traineeIds.flatMap((traineeId) =>
    phoneNumbers.map((phoneNumber) => {
      const record = buildVoiceMessageRecord(input, { traineeId, scope: input.scope, phoneNumber, fileId });
      TRAINEE_VOICE_MESSAGES_MOCK_DATA.push(record);
      return record;
    }),
  );
  return toMutationResult(records.map((record) => record.id));
}

function checkPhoneNumbers(scope: VoiceMessageScope, phoneNumbers: PhoneString[]): FailedField {
  if (scope === "all") return null;
  const isValid = phoneNumbers.length > 0 && phoneNumbers.every(isValidPhone);
  return isValid ? null : VOICE_MESSAGE_FIELDS.phoneNumbers;
}

// ── עדכון ──

export function handleUpdateTraineeVoiceMessage(request: MockRequest): UpdateTraineeVoiceMessageResponse {
  const input = request.body as UpdateTraineeVoiceMessageRequest;
  throwIfInvalid(checkDatesAndDecision(input));

  // תפיסת הרשומה הקודמת (409); ההיקף והמספר נעולים בעריכה, ולכן נלקחים ממנה
  const previous = findReplaceableRecord(TRAINEE_VOICE_MESSAGES_MOCK_DATA, input.previousId);
  previous.isActive = false;

  const record = buildVoiceMessageRecord(input, {
    traineeId: previous.traineeId,
    scope: previous.scope,
    phoneNumber: previous.phoneNumber,
    phoneNumberId: previous.phoneNumberId,
    fileId: allocateFileId(),
  });
  TRAINEE_VOICE_MESSAGES_MOCK_DATA.push(record);
  return toMutationResult([record.id]);
}

// ── אימות: התאריכים וההחלטה (ספק 05 form §5); כל שדות ההחלטה חובה (ספק 00 §4.3) ──

type VoiceMessageSaveInput = VoiceMessageDecisionInput & { startDate: string; endDate: string };

function checkDatesAndDecision(input: VoiceMessageSaveInput): FailedField {
  return (
    requireDateRange(input.startDate, input.endDate, VOICE_MESSAGE_FIELDS.startDate, VOICE_MESSAGE_FIELDS.endDate) ??
    requireText(input.reason, DETAILS_MAX_LENGTH, VOICE_MESSAGE_FIELDS.reason) ??
    requireText(input.details, DETAILS_MAX_LENGTH, VOICE_MESSAGE_FIELDS.details) ??
    checkApproverAndFile(input)
  );
}

// ── בניית הרשומות ──

interface VoiceMessageIdentity {
  traineeId: number;
  scope: VoiceMessageScope;
  phoneNumber: PhoneString | null;
  /** בעריכה - המזהה של המספר הנעול */
  phoneNumberId?: number | null;
  fileId: number;
}

/** מספר שכבר קיים בהודעות שומר על המזהה שלו; מספר חדש מקבל מזהה חדש */
function phoneNumberIdOf(phoneNumber: PhoneString): number {
  const knownNumber = TRAINEE_VOICE_MESSAGES_MOCK_DATA.find((record) => record.phoneNumber === phoneNumber);
  if (knownNumber?.phoneNumberId) return knownNumber.phoneNumberId;
  const usedIds = TRAINEE_VOICE_MESSAGES_MOCK_DATA.map((record) => record.phoneNumberId ?? 0);
  return Math.max(NEW_PHONE_NUMBER_ID_BASE, ...usedIds) + 1;
}

function resolvePhoneNumberId(identity: VoiceMessageIdentity): number | null {
  if (identity.phoneNumber === null) return null;
  return identity.phoneNumberId ?? phoneNumberIdOf(identity.phoneNumber);
}

function buildVoiceMessageRecord(
  input: VoiceMessageSaveInput & { repeatDuringCall: boolean },
  identity: VoiceMessageIdentity,
): StoredRecord<TraineeVoiceMessageRecordDto> {
  return {
    id: nextRecordId(TRAINEE_VOICE_MESSAGES_MOCK_DATA),
    traineeId: identity.traineeId,
    scope: identity.scope,
    phoneNumberId: resolvePhoneNumberId(identity),
    phoneNumber: identity.phoneNumber,
    repeatDuringCall: input.repeatDuringCall,
    reason: input.reason,
    dateStart: input.startDate,
    dateEnd: input.endDate,
    ...decisionFromInput(input.details, input, identity.fileId),
    ...buildAuditMetadata(input.endDate, 0, MOCK_CURRENT_USER_ID),
    isActive: true,
  };
}
