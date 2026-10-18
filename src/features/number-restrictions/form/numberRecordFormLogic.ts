import {
  CLOSED_CONDITIONS,
  EMPTY_CALL_TERMS,
  callTermsFromRecord,
  conditionsValuesFromRecord,
  createNewConditionsValues,
  openConditionsForRecord,
  openConditionsForTerms,
  type CallConditionsValues,
  type CallTermsValues,
  type OpenConditions,
} from "@/features/records/form/callConditionsLogic";
import {
  createDefaultDateRange,
  touchedDatesFor,
  type DateBounds,
  type TouchedDates,
} from "@/features/records/form/dateRangeLogic";
import {
  createBasedOnDecisionValues,
  createEmptyDecisionValues,
  decisionValuesFromRecord,
  type DecisionValues,
} from "@/features/records/form/decisionLogic";
import {
  withoutErrors,
  type CallFormErrorSlot,
  type FormErrors,
} from "@/features/records/form/formErrors";
import type { FormStartingPoint } from "@/features/records/form/formStartingPoint";
import { FORM_TEXTS } from "@/features/records/form/formTexts";
import { tryAddPhone } from "@/features/records/form/phone/phoneNumbersLogic";
import type { ISODateString, PhoneString } from "@/schemas/common.schema";
import type {
  SourceRestrictionSummaryDto,
  TraineePhoneRecordDto,
  TraineePhoneRecordType,
} from "@/schemas/phone-exceptions.schema";
import { normalizePhone } from "@/shared/formatting/phoneFormat";
import { NUMBER_RESTRICTIONS_TEXTS } from "../numberRestrictionsTexts";

/*
 * המצב והכללים של טופס "הגבלה/היתר למספר" (ספק 04 form §4-§6), בפונקציות טהורות:
 * כל פעולה של המשתמש היא מעבר ממצב למצב, וכך האיפוסים שמשפיעים על כמה שדות יחד קורים במקום אחד.
 */

const TEXTS = NUMBER_RESTRICTIONS_TEXTS.form;

export type NumberFormMode = "create" | "edit";

export interface NumberRecordFormValues extends CallConditionsValues, DecisionValues {}

/** התנאים של היתר שהסתיים, וההגבלה שהוא נשען עליה - כדי לבחור בה שוב אם היא עדיין חלה */
export interface CopiedPermitTerms {
  terms: CallTermsValues;
  preferredRestrictionId: number;
}

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
  /** היתר חדש על בסיס היתר שהסתיים: התנאים שיוחלו כשתיבחר הגבלה. null = התנאים מתאפסים בבחירה */
  copiedPermitTerms: CopiedPermitTerms | null;
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
  "duration",
  "dates",
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

// ── מצב הפתיחה (ספק 04 form §4.1) ──

const IDLE_LOOKUP: PermitLookup = { status: "idle", searchedPhone: null, results: [] };

const COMMON_INITIAL_STATE = {
  phoneDraft: "",
  addedPhones: [],
  lookup: IDLE_LOOKUP,
  selectedRestriction: null,
  isPickerOpen: false,
  copiedPermitTerms: null,
  errors: {},
};

/**
 * יצירה: היתר, שדה טלפון ריק, היום עד מחר. עריכה: הכל מהרשומה, והסוג והמספר נעולים.
 * על בסיס רשומה שהסתיימה: אותו סוג ומספר, התנאים, הסיבה והפירוט; התאריכים, הגורם המאשר והקובץ חדשים
 */
export function createInitialNumberRecordState(
  startingPoint: FormStartingPoint<TraineePhoneRecordDto>,
  today: ISODateString,
): NumberRecordFormState {
  switch (startingPoint.kind) {
    case "new":
      return {
        ...COMMON_INITIAL_STATE,
        mode: "create",
        recordType: "permit",
        values: { ...createNewConditionsValues(today), ...createEmptyDecisionValues() },
        touchedDates: touchedDatesFor(false),
        openConditions: CLOSED_CONDITIONS,
      };
    case "edit": {
      const { record } = startingPoint;
      return {
        ...COMMON_INITIAL_STATE,
        mode: "edit",
        recordType: record.type,
        selectedRestriction: record.type === "permit" ? record.sourceRestriction : null,
        values: { ...conditionsValuesFromRecord(record), ...decisionValuesFromRecord(record) },
        touchedDates: touchedDatesFor(true),
        openConditions: openConditionsForRecord(record),
      };
    }
    case "basedOn":
      return createBasedOnState(startingPoint.record, today);
  }
}

/**
 * הגבלה: המספר כבר ברשימה והתנאים מועתקים. היתר: המספר בשדה החיפוש (החיפוש רץ כשהטופס נפתח),
 * והתנאים מוחלים כשתיבחר הגבלה - אותה הגבלה אם היא עדיין חלה
 */
function createBasedOnState(record: TraineePhoneRecordDto, today: ISODateString): NumberRecordFormState {
  const createState = {
    ...COMMON_INITIAL_STATE,
    mode: "create" as const,
    recordType: record.type,
    touchedDates: touchedDatesFor(false),
  };

  if (record.type === "restriction") {
    return {
      ...createState,
      addedPhones: [record.phoneNumber],
      values: {
        ...callTermsFromRecord(record),
        ...createDefaultDateRange(today),
        ...createBasedOnDecisionValues(record),
      },
      openConditions: openConditionsForRecord(record),
    };
  }

  return {
    ...createState,
    phoneDraft: record.phoneNumber,
    copiedPermitTerms: {
      terms: callTermsFromRecord(record),
      preferredRestrictionId: record.sourceRestriction.restrictionId,
    },
    values: { ...createNewConditionsValues(today), ...createBasedOnDecisionValues(record) },
    openConditions: CLOSED_CONDITIONS,
  };
}

/** היתר על בסיס היתר שהסתיים: המספר שהחיפוש שלו רץ מיד כשהטופס נפתח, או null */
export function phoneToSearchOnOpen(state: NumberRecordFormState): PhoneString | null {
  const shouldSearch = state.mode === "create" && state.recordType === "permit" && state.copiedPermitTerms !== null;
  return shouldSearch ? normalizePhone(state.phoneDraft) : null;
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
  const freshState = createInitialNumberRecordState({ kind: "new" }, today);
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

/**
 * 0 תוצאות - הודעה; אחת - נבחרת אוטומטית; כמה - הרשימה נפתחת בלי בחירה.
 * בהיתר על בסיס היתר שהסתיים, ההגבלה שההיתר הקודם נשען עליה נבחרת אם היא עדיין חלה
 */
export function completePhoneSearch(
  state: NumberRecordFormState,
  phone: PhoneString,
  results: SourceRestrictionSummaryDto[],
  today: ISODateString,
): NumberRecordFormState {
  // תשובה לחיפוש שכבר בוטל (המשתמש הקליד או החליף סוג בינתיים)
  if (!isCurrentSearch(state, phone)) return state;

  const searchedState: NumberRecordFormState = { ...state, lookup: { status: "done", searchedPhone: phone, results } };
  const preferredRestriction = results.find(
    (restriction) => restriction.restrictionId === state.copiedPermitTerms?.preferredRestrictionId,
  );
  if (preferredRestriction) {
    return chooseRestriction(searchedState, preferredRestriction, today);
  }
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
 * (או מהיום, המאוחר מביניהם) ועד סופה, והתנאים מתאפסים - או, בהיתר על בסיס היתר שהסתיים,
 * מקבלים את התנאים שהועתקו. "סיבות והחלטה" לא משתנים.
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
  const terms = state.copiedPermitTerms?.terms ?? EMPTY_CALL_TERMS;
  return {
    ...state,
    selectedRestriction: restriction,
    isPickerOpen: false,
    values: { ...state.values, startDate, endDate: restriction.endDate, ...terms },
    touchedDates: touchedDatesFor(true),
    openConditions: openConditionsForTerms(terms),
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
