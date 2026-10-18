import type { AppError } from "@/infrastructure/errors/appError";
import type { ISODateString, PermittedCallConditionsInput, PhoneString } from "@/schemas/common.schema";
import type {
  CreateTraineePhonePermitRequest,
  CreateTraineePhoneRestrictionRequest,
  SourceRestrictionSummaryDto,
  TraineePhonePermitRecordDto,
  TraineePhoneRecordDto,
  TraineePhoneRecordType,
  TraineePhoneRestrictionRecordDto,
  UpdateTraineePhonePermitRequest,
  UpdateTraineePhoneRestrictionRequest,
} from "@/schemas/phone-exceptions.schema";
import type { DateBounds } from "@/shared/components/form/CallDetailsBlock";
import type { DecisionValues } from "@/shared/components/form/DecisionBlock";
import { FORM_TEXTS } from "@/shared/components/form/formTexts";
import { commitPendingPhone, tryAddPhone } from "@/shared/components/form/phone/phoneNumbersLogic";
import { formatDateRange } from "@/shared/formatting/dateFormat";
import { normalizePhone } from "@/shared/formatting/phoneFormat";
import {
  CLOSED_CONDITIONS,
  conditionsValuesFromRecord,
  createNewConditionsValues,
  openConditionsForRecord,
  toConditionsInput,
  touchedDatesFor,
  validateDateRange,
  validateDuration,
  validateHours,
  type CallConditionsValues,
  type OpenConditions,
  type TouchedDates,
} from "@/shared/restrictions/callConditionsLogic";
import {
  createEmptyDecisionValues,
  decisionValuesFromRecord,
  toDecisionInput,
  validateDecision,
  type DecisionRules,
  type ValidatedDecision,
} from "@/shared/restrictions/decisionLogic";
import {
  CALL_FORM_SERVER_FIELD_SLOTS,
  mapServerFieldErrors,
  removeEmptyErrors,
  withoutErrors,
  type CallFormErrorSlot,
  type FormErrors,
} from "@/shared/restrictions/formErrors";
import { NUMBER_RESTRICTIONS_TEXTS } from "./numberRestrictionsTexts";

/*
 * המצב והכללים של טופס "הגבלה/היתר למספר" (ספק 04 form §4-§6), בפונקציות טהורות:
 * כל פעולה של המשתמש היא מעבר ממצב למצב, וכך האיפוסים שמשפיעים על כמה שדות יחד קורים במקום אחד.
 */

const TEXTS = NUMBER_RESTRICTIONS_TEXTS.form;

export type NumberFormMode = "create" | "edit";

export interface NumberRecordFormValues extends CallConditionsValues, DecisionValues {}

/** חיפוש ההגבלות של מספר, ביצירת היתר */
export interface PermitLookup {
  status: "idle" | "searching" | "done";
  /** המספר (מנורמל) שהחיפוש האחרון רץ עליו. null = עדיין לא חיפשו, או שהחיפוש נכשל */
  searchedPhone: PhoneString | null;
  results: SourceRestrictionSummaryDto[];
}

export interface NumberRecordFormState {
  mode: NumberFormMode;
  /** ביצירה המשתמש בוחר; בעריכה - הסוג של הרשומה, נעול */
  recordType: TraineePhoneRecordType;
  /** מה שבשדה הטלפון */
  phoneDraft: string;
  /** הגבלה חדשה: המספרים שנוספו, כל אחד יישמר כהגבלה נפרדת */
  addedPhones: PhoneString[];
  lookup: PermitLookup;
  /** היתר: ההגבלה שעליה הוא יחול (בעריכה - ההגבלה של הרשומה) */
  selectedRestriction: SourceRestrictionSummaryDto | null;
  /** רשימת ההגבלות פתוחה לבחירה. כל עוד היא פתוחה, בלוקים 1–3 מוסתרים */
  isPickerOpen: boolean;
  values: NumberRecordFormValues;
  touchedDates: TouchedDates;
  openConditions: OpenConditions;
  errors: NumberRecordFormErrors;
}

// ── שגיאות ──

export type NumberRecordErrorSlot = "phone" | "restriction" | CallFormErrorSlot;

export type NumberRecordFormErrors = FormErrors<NumberRecordErrorSlot>;

/** מקומות השגיאה בטופס, לפי סדר ההופעה שלהם מלמעלה למטה */
export const NUMBER_RECORD_ERROR_SLOTS: readonly NumberRecordErrorSlot[] = [
  "phone",
  "restriction",
  "dates",
  "duration",
  "hours",
  "devices",
  "reason",
  "details",
  "approver",
  "file",
];

/** השדה שמקבל פוקוס כשיש שגיאה במקום הזה */
export const NUMBER_RECORD_FIELD_IDS: Record<NumberRecordErrorSlot, string> = {
  phone: "number-record-phone",
  restriction: "number-record-restriction",
  dates: "number-record-start-date",
  duration: "number-record-duration",
  hours: "number-record-start-time",
  devices: "number-record-devices",
  reason: "number-record-reason",
  details: "number-record-details",
  approver: "number-record-approver",
  file: "number-record-file",
};

/** כותרת בוחר ההגבלה - מקבלת פוקוס אחרי בחירה, כדי שקורא מסך ידע שהבחירה נקלטה */
export const RESTRICTION_PICKER_HEADING_ID = "number-record-restriction-heading";

/** בהגבלה/היתר למספר הסיבה לא חובה (ספק 00 §4.3) */
export const NUMBER_DECISION_RULES: DecisionRules = { isReasonRequired: false };

// ── מצב הפתיחה (ספק 04 form §4.1) ──

const IDLE_LOOKUP: PermitLookup = { status: "idle", searchedPhone: null, results: [] };

/** יצירה: היתר, שדה טלפון ריק, היום עד מחר. עריכה: הכל מהרשומה, והסוג והמספר נעולים */
export function createInitialNumberRecordState(
  record: TraineePhoneRecordDto | null,
  today: ISODateString,
): NumberRecordFormState {
  const commonState = { phoneDraft: "", addedPhones: [], lookup: IDLE_LOOKUP, isPickerOpen: false, errors: {} };

  if (!record) {
    return {
      ...commonState,
      mode: "create",
      recordType: "permit",
      selectedRestriction: null,
      values: { ...createNewConditionsValues(today), ...createEmptyDecisionValues() },
      touchedDates: touchedDatesFor(false),
      openConditions: CLOSED_CONDITIONS,
    };
  }

  return {
    ...commonState,
    mode: "edit",
    recordType: record.type,
    selectedRestriction: record.type === "permit" ? record.sourceRestriction : null,
    values: { ...conditionsValuesFromRecord(record), ...decisionValuesFromRecord(record) },
    touchedDates: touchedDatesFor(true),
    openConditions: openConditionsForRecord(record),
  };
}

function pickDecisionValues({ reasonId, details, approver, approvedFile }: DecisionValues): DecisionValues {
  return { reasonId, details, approver, approvedFile };
}

// ── סוג הפעולה (ספק 04 form §4.2, §4.6) ──

/** הסוג האחר מתחיל מברירות המחדל שלו; נשמרים רק "סיבות והחלטה". כל השגיאות נמחקות */
export function changeRecordType(
  state: NumberRecordFormState,
  recordType: TraineePhoneRecordType,
  today: ISODateString,
): NumberRecordFormState {
  if (recordType === state.recordType) return state;
  const freshState = createInitialNumberRecordState(null, today);
  return { ...freshState, recordType, values: { ...freshState.values, ...pickDecisionValues(state.values) } };
}

/** "להגבלת המספר": מעבר להגבלה, והמספר שחיפשו הוא המספר הראשון שנוסף */
export function restrictSearchedNumber(state: NumberRecordFormState, today: ISODateString): NumberRecordFormState {
  const { searchedPhone } = state.lookup;
  const restrictionState = changeRecordType(state, "restriction", today);
  return searchedPhone ? { ...restrictionState, addedPhones: [searchedPhone] } : restrictionState;
}

// ── שדה הטלפון (ספק 04 form §4.3, §4.7) ──

/**
 * הקלדה מוחקת את שגיאת הטלפון. בהיתר, הקלדה אחרי חיפוש גם מבטלת את התוצאות, את ההגבלה הנבחרת
 * ואת המספר שנזכר, ובלוקים 1–3 מוסתרים. "סיבות והחלטה" נשמרים, ופרטי ההיתר יאותחלו בבחירה הבאה.
 */
export function changePhoneDraft(state: NumberRecordFormState, phoneDraft: string): NumberRecordFormState {
  const errors = withoutErrors(state.errors, ["phone", "restriction"]);
  const hasSearch = state.recordType === "permit" && state.lookup.status !== "idle";
  if (!hasSearch) {
    return { ...state, phoneDraft, errors };
  }
  return { ...state, phoneDraft, errors, lookup: IDLE_LOOKUP, selectedRestriction: null, isPickerOpen: false };
}

/** "חיפוש" פעיל כשיש מספר, והוא לא המספר שכבר חיפשו (או שמחפשים עכשיו) */
export function canSearchPhone(state: NumberRecordFormState): boolean {
  const phone = normalizePhone(state.phoneDraft);
  return phone !== "" && phone !== state.lookup.searchedPhone;
}

export function rejectInvalidPhone(state: NumberRecordFormState): NumberRecordFormState {
  return { ...state, errors: { ...state.errors, phone: FORM_TEXTS.phone.invalid } };
}

export function startPhoneSearch(state: NumberRecordFormState, phone: PhoneString): NumberRecordFormState {
  return {
    ...state,
    lookup: { status: "searching", searchedPhone: phone, results: [] },
    selectedRestriction: null,
    isPickerOpen: false,
    errors: withoutErrors(state.errors, ["phone", "restriction"]),
  };
}

function isCurrentSearch(state: NumberRecordFormState, phone: PhoneString): boolean {
  return state.lookup.status === "searching" && state.lookup.searchedPhone === phone;
}

/** 0 תוצאות - הודעה; אחת - נבחרת אוטומטית; כמה - הרשימה נפתחת בלי בחירה */
export function completePhoneSearch(
  state: NumberRecordFormState,
  phone: PhoneString,
  results: SourceRestrictionSummaryDto[],
  today: ISODateString,
): NumberRecordFormState {
  // תשובה לחיפוש שכבר בוטל (המשתמש הקליד או החליף סוג בינתיים)
  if (!isCurrentSearch(state, phone)) return state;

  const searchedState: NumberRecordFormState = { ...state, lookup: { status: "done", searchedPhone: phone, results } };
  if (results.length === 1) {
    return chooseRestriction(searchedState, results[0], today);
  }
  return { ...searchedState, isPickerOpen: results.length > 1 };
}

/** המספר נשאר בשדה, והחיפוש אפשרי שוב (ספק 04 form §7) */
export function failPhoneSearch(state: NumberRecordFormState, phone: PhoneString): NumberRecordFormState {
  if (!isCurrentSearch(state, phone)) return state;
  return { ...state, lookup: IDLE_LOOKUP, errors: { ...state.errors, phone: TEXTS.validation.searchFailed } };
}

export function addPhoneFromDraft(state: NumberRecordFormState): NumberRecordFormState {
  const result = tryAddPhone(state.phoneDraft, state.addedPhones);
  if ("error" in result) {
    return { ...state, errors: { ...state.errors, phone: result.error } };
  }
  // שדה ריק - אין מה להוסיף
  if (result.phones === state.addedPhones) return state;
  return { ...state, addedPhones: result.phones, phoneDraft: "" };
}

export function removeAddedPhone(state: NumberRecordFormState, phone: PhoneString): NumberRecordFormState {
  return { ...state, addedPhones: state.addedPhones.filter((addedPhone) => addedPhone !== phone) };
}

// ── בחירת ההגבלה (ספק 04 form §4.4, §4.5; החלטה: הרשימה תופסת את הטופס, ובחירה בכפתור ייעודי) ──

/**
 * בחירה באותה הגבלה רק סוגרת את הרשימה. בחירה ראשונה או בהגבלה אחרת: התאריכים מתחילת ההגבלה
 * (או מהיום, המאוחר מביניהם) ועד סופה, והתנאים מתאפסים. "סיבות והחלטה" לא משתנים.
 */
export function chooseRestriction(
  state: NumberRecordFormState,
  restriction: SourceRestrictionSummaryDto,
  today: ISODateString,
): NumberRecordFormState {
  if (state.selectedRestriction?.restrictionId === restriction.restrictionId) {
    return { ...state, isPickerOpen: false };
  }

  const startDate = restriction.startDate > today ? restriction.startDate : today;
  return {
    ...state,
    selectedRestriction: restriction,
    isPickerOpen: false,
    values: {
      ...state.values,
      startDate,
      endDate: restriction.endDate,
      limitKind: "full",
      durationText: "",
      startTime: "",
      endTime: "",
      deviceIds: [],
    },
    touchedDates: touchedDatesFor(true),
    openConditions: CLOSED_CONDITIONS,
    errors: withoutErrors(state.errors, ["restriction", "dates", "duration", "hours", "devices"]),
  };
}

export function openRestrictionPicker(state: NumberRecordFormState): NumberRecordFormState {
  return { ...state, isPickerOpen: true };
}

/** "ביטול" אחרי "החלפה": חוזרים להגבלה שכבר נבחרה, בלי שינוי. בלי הגבלה נבחרת הרשימה נשארת פתוחה */
export function closeRestrictionPicker(state: NumberRecordFormState): NumberRecordFormState {
  if (state.selectedRestriction === null) return state;
  return { ...state, isPickerOpen: false };
}

// ── הצגת הבלוקים (ספק 04 form §3.8, עם הרשימה שתופסת את הטופס) ──

export function shouldShowDetailBlocks(state: NumberRecordFormState): boolean {
  if (state.mode === "edit" || state.recordType === "restriction") return true;
  return state.selectedRestriction !== null && !state.isPickerOpen;
}

/** היתר: התאריכים בתוך תקופת ההגבלה (ספק 04 form §4.8). הגבלה: בלי גבולות */
export function permitDateBounds(state: NumberRecordFormState): DateBounds | null {
  const restriction = state.recordType === "permit" ? state.selectedRestriction : null;
  return restriction ? { min: restriction.startDate, max: restriction.endDate } : null;
}

export function buildFormTitle({ mode, recordType }: Pick<NumberRecordFormState, "mode" | "recordType">): string {
  return TEXTS.titles[mode][recordType];
}

// ── שינוי שדות ──

export function changeFormValues(
  state: NumberRecordFormState,
  update: Partial<NumberRecordFormValues>,
  clearedSlots: NumberRecordErrorSlot[],
): NumberRecordFormState {
  return { ...state, values: { ...state.values, ...update }, errors: withoutErrors(state.errors, clearedSlots) };
}

export function changeDate(
  state: NumberRecordFormState,
  field: keyof TouchedDates,
  date: ISODateString,
): NumberRecordFormState {
  const changedState = changeFormValues(state, { [field]: date }, ["dates"]);
  return { ...changedState, touchedDates: { ...changedState.touchedDates, [field]: true } };
}

export function toggleCondition(state: NumberRecordFormState, condition: keyof OpenConditions): NumberRecordFormState {
  return { ...state, openConditions: { ...state.openConditions, [condition]: !state.openConditions[condition] } };
}

/** אקורדיון שיש בו שגיאה נפתח (ספק 00 §3.10) */
export function showErrors(state: NumberRecordFormState, errors: NumberRecordFormErrors): NumberRecordFormState {
  return {
    ...state,
    errors,
    openConditions: {
      hours: state.openConditions.hours || Boolean(errors.hours),
      devices: state.openConditions.devices || Boolean(errors.devices),
    },
  };
}

// ── שמירה: ולידציה (ספק 04 form §4.10, §5) ──

interface SubmissionCheck {
  /** המצב שנשמר: הרשימה סגורה, ומספר שנשאר בשדה כבר נוסף */
  submittedState: NumberRecordFormState;
  errors: NumberRecordFormErrors;
}

/**
 * "שמור": רשימה שנפתחה מחדש אחרי בחירה נסגרת, כדי שכל הבלוקים יוצגו ויבדקו.
 * בהגבלה חדשה, מספר שנשאר בשדה נוסף. אחר כך כל הכללים רצים יחד.
 */
export function checkSubmission(state: NumberRecordFormState): SubmissionCheck {
  const visibleState = closeRestrictionPicker(state);

  if (visibleState.mode === "create" && visibleState.recordType === "permit") {
    const lookupErrors = validatePermitLookup(visibleState);
    // עד שנבחרה הגבלה שאר הטופס מוסתר, ולכן רק החיפוש נבדק
    if (lookupErrors) return { submittedState: visibleState, errors: lookupErrors };
  }

  if (visibleState.mode === "create" && visibleState.recordType === "restriction") {
    const committed = commitPendingPhone(visibleState.phoneDraft, visibleState.addedPhones);
    const committedState =
      "phones" in committed ? { ...visibleState, addedPhones: committed.phones, phoneDraft: "" } : visibleState;
    const phoneErrors = "error" in committed ? { phone: committed.error } : {};
    return { submittedState: committedState, errors: { ...phoneErrors, ...validateRecordRules(committedState) } };
  }

  return { submittedState: visibleState, errors: validateRecordRules(visibleState) };
}

function validatePermitLookup(state: NumberRecordFormState): NumberRecordFormErrors | null {
  const { lookup } = state;
  if (lookup.status !== "done") return { phone: TEXTS.validation.searchRequired };
  if (lookup.results.length === 0) return { phone: TEXTS.validation.restrictedSearchRequired };
  if (state.selectedRestriction === null) return { restriction: TEXTS.validation.restrictionRequired };
  return null;
}

/** הכללים של §5 שחלים על כל רשומה: תאריכים, משך, שעות, ו"סיבות והחלטה" */
function validateRecordRules(state: NumberRecordFormState): NumberRecordFormErrors {
  const { values } = state;
  return removeEmptyErrors<NumberRecordErrorSlot>({
    dates: validateDateRange(values) ?? validatePermitDatesInsideRestriction(state),
    duration: validateDuration(values),
    hours: validateHours(values),
    ...validateDecision(values, NUMBER_DECISION_RULES),
  });
}

function validatePermitDatesInsideRestriction(state: NumberRecordFormState): string | undefined {
  const bounds = permitDateBounds(state);
  if (!bounds) return undefined;
  const { startDate, endDate } = state.values;
  const isInside = startDate >= bounds.min && endDate <= bounds.max;
  return isInside ? undefined : TEXTS.validation.permitOutsideRestriction(formatDateRange(bounds.min, bounds.max));
}

// ── שמירה: שגיאות שרת → מקומות בטופס (ספק 04 form §6.3) ──

const NUMBER_RECORD_SERVER_FIELD_SLOTS: Record<string, NumberRecordErrorSlot> = {
  ...CALL_FORM_SERVER_FIELD_SLOTS,
  phoneNumber: "phone",
  phoneNumbers: "phone",
  sourceRestrictionId: "restriction",
};

/** שגיאות שדה מהשרת, או 409 ביצירת היתר (ההגבלה כבר לא פעילה). אובייקט ריק = שגיאה כללית */
export function mapSaveErrorToSlots(appError: AppError, state: NumberRecordFormState): NumberRecordFormErrors {
  if (appError.code === "VALIDATION_ERROR") {
    return mapServerFieldErrors(appError.fieldErrors, NUMBER_RECORD_SERVER_FIELD_SLOTS);
  }
  const isCreatePermit = state.mode === "create" && state.recordType === "permit";
  if (appError.code === "CONFLICT" && isCreatePermit) {
    return { restriction: TEXTS.validation.restrictionNoLongerActive };
  }
  return {};
}

// ── שמירה: בניית הבקשות (ספק 04 form §6.1) ──

/**
 * בעריכה, סיבה שלא נמצאה ברשימה (למשל כי הרשימה לא נטענה) נשמרת כמו שהייתה ברשומה,
 * כי הסיבה לא חובה ואין לה שגיאה שתתריע על כך.
 */
export function keepRecordReasonWhenUnchosen(
  decision: ValidatedDecision,
  record: TraineePhoneRecordDto | null,
): ValidatedDecision {
  if (!record || decision.reasonId !== null) return decision;
  return { ...decision, reasonName: record.reason };
}

type DatesAndConditionsInput = PermittedCallConditionsInput & { startDate: ISODateString; endDate: ISODateString };

function datesAndConditions(values: NumberRecordFormValues): DatesAndConditionsInput {
  return { startDate: values.startDate, endDate: values.endDate, ...toConditionsInput(values) };
}

/** כל מספר יישמר כהגבלה נפרדת עם אותם ערכים */
export function buildCreateRestrictionRequest(
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

export function buildUpdateRestrictionRequest(
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

export function buildCreatePermitRequest(
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

export function buildUpdatePermitRequest(
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
