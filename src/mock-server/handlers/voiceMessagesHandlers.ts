import type { PhoneString } from "@/schemas/common.schema";
import type {
  CreateTraineeVoiceMessageRequest,
  CreateTraineeVoiceMessageResponse,
  GetTraineeVoiceMessagesRequest,
  GetTraineeVoiceMessagesResponse,
  TraineeVoiceMessageRecordDto,
  UpdateTraineeVoiceMessageRequest,
  UpdateTraineeVoiceMessageResponse,
  VoiceMessageScope,
} from "@/schemas/voice-messages.schema";
import { isValidPhone } from "@/shared/formatting/phoneFormat";
import { buildAuditMetadata } from "../data/recordMetadataBuilders";
import { TRAINEE_VOICE_MESSAGES_MOCK_DATA } from "../data/traineeVoiceMessagesMockData";
import type { MockRequest } from "../mockRequest";
import {
  MOCK_CURRENT_USER_ID,
  decisionFromInput,
  nextRecordId,
  throwConflict,
  throwIfEnded,
  throwNotFound,
  toMutationResult,
} from "./mutationHelpers";
import { throwIfInvalid, validateDatesAndDecision, type DatesAndDecisionInput } from "./recordInputValidation";

/*
 * "הודעה קולית לנמען" (ספק 05): ההודעות של החניך ושמירתן.
 * כמו בשרת: עדכון לא משנה רשומה - הקודמת נכבית (LOGI_ACTIVE = 0) ונוספת רשומה פעילה חדשה.
 */

const INVALID_INPUT_MESSAGE = "Voice message is invalid";

const PHONE_VALIDATION_MESSAGES = {
  invalid: "מספר טלפון לא תקין",
  required: "יש להוסיף לפחות מספר אחד",
} as const;

// מזהי מספרי טלפון חדשים, אחרי אלה שבמוק
const NEW_PHONE_NUMBER_ID_BASE = 7900;

// ── שליפה (ספק 05 history §6) ──

export function handleGetTraineeVoiceMessages(request: MockRequest): GetTraineeVoiceMessagesResponse {
  const { traineeIds } = request.body as GetTraineeVoiceMessagesRequest;

  const records = TRAINEE_VOICE_MESSAGES_MOCK_DATA.filter(
    (record) => record.isActive && traineeIds.includes(record.traineeId),
  );
  return { records };
}

// ── יצירה (ספק 05 overview §2) ──

export function handleCreateTraineeVoiceMessage(request: MockRequest): CreateTraineeVoiceMessageResponse {
  const input = request.body as CreateTraineeVoiceMessageRequest;
  throwIfInvalid(
    { ...validatePhoneNumbers(input.scope, input.phoneNumbers), ...validateDatesAndDecision(input) },
    INVALID_INPUT_MESSAGE,
  );

  // בכל השיחות - רשומה אחת בלי מספר; במספרים נבחרים - רשומה נפרדת לכל מספר
  const phoneNumbers: (PhoneString | null)[] = input.scope === "all" ? [null] : input.phoneNumbers;
  const records = input.traineeIds.flatMap((traineeId) =>
    phoneNumbers.map((phoneNumber) => {
      const record = buildVoiceMessageRecord(input, { traineeId, scope: input.scope, phoneNumber });
      TRAINEE_VOICE_MESSAGES_MOCK_DATA.push(record);
      return record;
    }),
  );
  return toMutationResult(records);
}

function validatePhoneNumbers(scope: VoiceMessageScope, phoneNumbers: PhoneString[]): Record<string, string> {
  if (scope === "all") {
    return {};
  }
  if (phoneNumbers.length === 0) {
    return { phoneNumbers: PHONE_VALIDATION_MESSAGES.required };
  }
  if (!phoneNumbers.every(isValidPhone)) {
    return { phoneNumbers: PHONE_VALIDATION_MESSAGES.invalid };
  }
  return {};
}

// ── עדכון ──

export function handleUpdateTraineeVoiceMessage(request: MockRequest): UpdateTraineeVoiceMessageResponse {
  const input = request.body as UpdateTraineeVoiceMessageRequest;
  const previous = findReplaceableVoiceMessage(input.previousId);
  throwIfInvalid(validateDatesAndDecision(input), INVALID_INPUT_MESSAGE);

  // ההיקף והמספר נעולים בעריכה, ולכן נלקחים מהרשומה הקודמת
  previous.isActive = false;
  const record = buildVoiceMessageRecord(input, {
    traineeId: previous.traineeId,
    scope: previous.scope,
    phoneNumber: previous.phoneNumber,
    phoneNumberId: previous.phoneNumberId,
  });
  TRAINEE_VOICE_MESSAGES_MOCK_DATA.push(record);
  return toMutationResult([record]);
}

function findReplaceableVoiceMessage(recordId: number): TraineeVoiceMessageRecordDto {
  const previous = TRAINEE_VOICE_MESSAGES_MOCK_DATA.find((record) => record.id === recordId);
  if (!previous) {
    throwNotFound(`No voice message ${recordId}`);
  }
  if (!previous.isActive) {
    throwConflict(`Voice message ${recordId} was already replaced`);
  }
  throwIfEnded(previous, `Voice message ${recordId}`);
  return previous;
}

// ── בניית הרשומות ──

interface VoiceMessageIdentity {
  traineeId: number;
  scope: VoiceMessageScope;
  phoneNumber: PhoneString | null;
  /** בעריכה - המזהה של המספר הנעול */
  phoneNumberId?: number | null;
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
  input: DatesAndDecisionInput & { repeatDuringCall: boolean },
  identity: VoiceMessageIdentity,
): TraineeVoiceMessageRecordDto {
  return {
    id: nextRecordId(TRAINEE_VOICE_MESSAGES_MOCK_DATA),
    traineeId: identity.traineeId,
    scope: identity.scope,
    phoneNumberId: resolvePhoneNumberId(identity),
    phoneNumber: identity.phoneNumber,
    repeatDuringCall: input.repeatDuringCall,
    startDate: input.startDate,
    endDate: input.endDate,
    ...decisionFromInput(input),
    ...buildAuditMetadata(input.startDate, input.endDate, 0, MOCK_CURRENT_USER_ID),
  };
}
