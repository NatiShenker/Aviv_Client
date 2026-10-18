import { validateDuration, validateHours } from "@/features/records/form/callConditionsLogic";
import { validateDateRange } from "@/features/records/form/dateRangeLogic";
import { validateDecision } from "@/features/records/form/decisionLogic";
import { CALL_FORM_SERVER_FIELD_SLOTS, mapServerFieldErrors, removeEmptyErrors } from "@/features/records/form/formErrors";
import { commitPendingPhone } from "@/features/records/form/phone/phoneNumbersLogic";
import type { AppError } from "@/infrastructure/errors/appError";
import { formatDateRange } from "@/shared/formatting/dateFormat";
import { NUMBER_RESTRICTIONS_TEXTS } from "../numberRestrictionsTexts";
import {
  closeRestrictionPicker,
  permitDateBounds,
  type NumberRecordErrorSlot,
  type NumberRecordFormErrors,
  type NumberRecordFormState,
} from "./numberRecordFormLogic";

const TEXTS = NUMBER_RESTRICTIONS_TEXTS.form;

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
export function checkNumberRecordSubmission(state: NumberRecordFormState): SubmissionCheck {
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
    ...validateDecision(values),
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
