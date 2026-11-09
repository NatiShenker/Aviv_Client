import { createDefaultDateRange, validateDateRange, type DateRangeValues } from "@/features/records/form/dateRangeLogic";
import {
  createBasedOnDecisionValues,
  createEmptyDecisionValues,
  decisionValuesFromRecord,
  toApprovalInput,
  validateDecision,
  type DecisionValues,
  type ValidatedDecision,
} from "@/features/records/form/decision/decisionLogic";
import { mapServerFieldErrors, removeEmptyErrors, type FormErrors } from "@/features/records/form/formErrors";
import type { FormStartingPoint } from "@/features/records/form/formStartingPoint";
import { commitPendingPhone, tryAddPhone } from "@/features/records/form/phone/phoneNumbersLogic";
import type { AppError } from "@/infrastructure/errors/appError";
import type { ISODateString, PhoneString } from "@/types/common.schema";
import type {
  CreateTraineeVoiceMessageRequest,
  TraineeVoiceMessageRecordDto,
  UpdateTraineeVoiceMessageRequest,
  VoiceMessageDecisionInput,
  VoiceMessageScope,
} from "@/types/voice-messages.schema";
import { DEFAULT_SCOPE } from "./voiceMessagesOptions";

/*
 * הערכים והכללים של טופס "הודעה קולית לנמען" (ספק 05 form §4-§6), בפונקציות טהורות.
 */

// ── ערכי הטופס ──

export interface VoiceMessageFormValues extends DateRangeValues, DecisionValues {
  scope: VoiceMessageScope;
  /** מה שבשדה הטלפון, לפני שנוסף */
  phoneDraft: string;
  /** המספרים שנוספו - כל אחד יישמר כהודעה נפרדת. נשמרים גם כשעוברים ל"בכל השיחות", אבל לא נשלחים */
  phones: PhoneString[];
  repeatDuringCall: boolean;
}

/** מה ההודעה עושה - ההיקף, המספר והחזרה - כפי שהם ברשומה */
function messageTermsFromRecord(record: TraineeVoiceMessageRecordDto) {
  return {
    scope: record.scope,
    phoneDraft: "",
    phones: record.phoneNumber === null ? [] : [record.phoneNumber],
    repeatDuringCall: record.repeatDuringCall,
  };
}

/**
 * יצירה: בכל השיחות, הודעה רגילה, היום עד מחר. עריכה: הכל מהרשומה, וההיקף והמספר נעולים.
 * על בסיס הודעה שהסתיימה: ההיקף, המספר, החזרה, הסיבה והפירוט עוברים; התאריכים, הגורם המאשר והקובץ חדשים
 */
export function createInitialVoiceMessageValues(
  startingPoint: FormStartingPoint<TraineeVoiceMessageRecordDto>,
  today: ISODateString,
): VoiceMessageFormValues {
  switch (startingPoint.kind) {
    case "new":
      return {
        scope: DEFAULT_SCOPE,
        phoneDraft: "",
        phones: [],
        repeatDuringCall: false,
        ...createDefaultDateRange(today),
        ...createEmptyDecisionValues(),
      };
    case "edit":
      return {
        ...messageTermsFromRecord(startingPoint.record),
        startDate: startingPoint.record.dateStart,
        endDate: startingPoint.record.dateEnd,
        ...decisionValuesFromRecord(startingPoint.record),
      };
    case "basedOn":
      return {
        ...messageTermsFromRecord(startingPoint.record),
        ...createDefaultDateRange(today),
        ...createBasedOnDecisionValues(startingPoint.record),
      };
  }
}

// ── שגיאות ──

export type VoiceMessageErrorSlot = "phone" | "dates" | "reason" | "details" | "approver" | "file";

export type VoiceMessageFormErrors = FormErrors<VoiceMessageErrorSlot>;

/** מקומות השגיאה בטופס, לפי סדר ההופעה שלהם מלמעלה למטה */
export const VOICE_MESSAGE_ERROR_SLOTS: readonly VoiceMessageErrorSlot[] = [
  "phone",
  "dates",
  "reason",
  "details",
  "approver",
  "file",
];

/** השדה שמקבל פוקוס כשיש שגיאה במקום הזה */
export const VOICE_MESSAGE_FIELD_IDS: Record<VoiceMessageErrorSlot, string> = {
  phone: "voice-message-phone",
  dates: "voice-message-start-date",
  reason: "voice-message-reason",
  details: "voice-message-details",
  approver: "voice-message-approver",
  file: "voice-message-file",
};

// ── מספרים (ספק 05 form §4.3, כמו ספק 04 form §4.7) ──

/** תוצאת "הוספה": הערכים החדשים, או שגיאה לשדה הטלפון */
export type AddPhoneOutcome = { values: VoiceMessageFormValues } | { error: string };

export function addDraftPhone(values: VoiceMessageFormValues): AddPhoneOutcome {
  const result = tryAddPhone(values.phoneDraft, values.phones);
  if ("error" in result) {
    return { error: result.error };
  }
  const wasAdded = result.phones !== values.phones;
  return { values: { ...values, phones: result.phones, phoneDraft: wasAdded ? "" : values.phoneDraft } };
}

// ── שמירה: ולידציה (ספק 05 form §4.5, §5) ──

export interface SubmissionCheck {
  /** הערכים כפי שיישמרו: מספר תקין שנשאר בשדה נוסף לרשימה */
  submittedValues: VoiceMessageFormValues;
  errors: VoiceMessageFormErrors;
}

/** כל הכללים רצים יחד, ובכל מקום מוצגת רק השגיאה הראשונה */
export function checkVoiceMessageSubmission(values: VoiceMessageFormValues, isEditMode: boolean): SubmissionCheck {
  // המספרים נבדקים רק ביצירה במספרים נבחרים: בעריכה המספר נעול
  const shouldCheckPhones = !isEditMode && values.scope === "selected";
  let submittedValues = values;
  let phoneError: string | undefined;

  if (shouldCheckPhones) {
    const result = commitPendingPhone(values.phoneDraft, values.phones);
    if ("error" in result) {
      phoneError = result.error;
    } else {
      submittedValues = { ...values, phones: result.phones, phoneDraft: "" };
    }
  }

  const errors = removeEmptyErrors<VoiceMessageErrorSlot>({
    phone: phoneError,
    dates: validateDateRange(submittedValues),
    ...validateDecision(submittedValues),
  });
  return { submittedValues, errors };
}

// ── שגיאות שרת (400) → מקומות בטופס (ספק 05 form §6.3) ──

// השדות של 05 בשמות שנוסחו בקליינט; שדות האישור המשותפים בשמות הסרביס (idntUserApproval, textFile)
const VOICE_MESSAGE_SERVER_FIELD_SLOTS: Record<string, VoiceMessageErrorSlot> = {
  phoneNumber: "phone",
  phoneNumbers: "phone",
  startDate: "dates",
  endDate: "dates",
  reason: "reason",
  reasonCode: "reason",
  details: "details",
  idntUserApproval: "approver",
  textFile: "file",
};

/** מקומות שגיאה בלי שדה גלוי: בעריכה ההיקף נעול בכרטיס, ובהודעה לכל השיחות אין שדה מספרים */
export function hiddenVoiceMessageErrorSlots(
  values: VoiceMessageFormValues,
  isEditMode: boolean,
): VoiceMessageErrorSlot[] {
  return isEditMode || values.scope === "all" ? ["phone"] : [];
}

export function mapVoiceMessageSaveError(appError: AppError): VoiceMessageFormErrors {
  if (appError.code !== "VALIDATION_ERROR") return {};
  return mapServerFieldErrors(appError.fieldErrors, VOICE_MESSAGE_SERVER_FIELD_SLOTS);
}

// ── שמירה: בניית הבקשות (ספק 05 form §6.1) ──

/** ההחלטה של 05: הסיבה (שם וקוד) והפירוט כפי שנוסחו בקליינט, והאישור המשותף (גורם מאשר וקובץ) */
function buildDecisionInput(details: string, decision: ValidatedDecision): VoiceMessageDecisionInput {
  return {
    reason: decision.reasonName,
    reasonCode: decision.reasonId,
    details,
    ...toApprovalInput(decision),
  };
}

/** בכל השיחות - בלי מספרים; במספרים נבחרים - כל מספר יישמר כהודעה נפרדת עם אותם ערכים */
export function buildCreateVoiceMessageRequest(
  values: VoiceMessageFormValues,
  decision: ValidatedDecision,
  traineeId: number,
): CreateTraineeVoiceMessageRequest {
  return {
    traineeIds: [traineeId],
    scope: values.scope,
    phoneNumbers: values.scope === "selected" ? values.phones : [],
    repeatDuringCall: values.repeatDuringCall,
    startDate: values.startDate,
    endDate: values.endDate,
    ...buildDecisionInput(values.details, decision),
  };
}

/** ההיקף והמספר נעולים בעריכה, ולכן נשלחים כפי שהם ברשומה */
export function buildUpdateVoiceMessageRequest(
  values: VoiceMessageFormValues,
  decision: ValidatedDecision,
  record: TraineeVoiceMessageRecordDto,
): UpdateTraineeVoiceMessageRequest {
  return {
    previousId: record.id,
    traineeId: record.traineeId,
    scope: record.scope,
    phoneNumber: record.phoneNumber,
    repeatDuringCall: values.repeatDuringCall,
    startDate: values.startDate,
    endDate: values.endDate,
    ...buildDecisionInput(values.details, decision),
  };
}
