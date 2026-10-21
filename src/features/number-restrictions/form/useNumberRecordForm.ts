import { useEffect, useState, type FormEvent } from "react";
import type { PermittedCondition } from "@/features/records/form/call-conditions/callConditionsLogic";
import {
  decisionErrorSlotsFor,
  findReasonIdByName,
  toValidatedDecision,
  type DecisionValues,
} from "@/features/records/form/decision/decisionLogic";
import { findFirstErrorSlot, hasErrors, splitByHiddenSlots } from "@/features/records/form/formErrors";
import { editedRecordOf, sourceRecordOf, type FormStartingPoint } from "@/features/records/form/formStartingPoint";
import { FORM_TEXTS } from "@/features/records/form/formTexts";
import { useSaveSuccessToast } from "@/features/records/form/useSaveSuccessToast";
import { toAppError } from "@/infrastructure/errors/appError";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import { useFocusAfterRender } from "@/shared/hooks/useFocusAfterRender";
import type { CallLimitKind, LookupItem, PhoneString } from "@/types/common.schema";
import type {
  SourceRestrictionSummaryDto,
  TraineePhoneRecordDto,
  TraineePhoneRecordType,
} from "@/types/phone-exceptions.schema";
import { todayIsoDate } from "@/utils/dates";
import { isValidPhone, normalizePhone } from "@/utils/phone";
import { buildNumberRecordKey } from "../numberRestrictionsLogic";
import { NUMBER_RESTRICTIONS_TEXTS } from "../numberRestrictionsTexts";
import {
  NUMBER_RECORD_ERROR_SLOTS,
  NUMBER_RECORD_FIELD_IDS,
  RESTRICTION_PICKER_HEADING_ID,
  addPhoneFromDraft,
  changeDate,
  changeFormValues,
  changePhoneDraft,
  changeRecordType,
  chooseRestriction,
  closeRestrictionPicker,
  completePhoneSearch,
  createInitialNumberRecordState,
  failPhoneSearch,
  markLookupOutdated,
  openRestrictionPicker,
  phoneToSearchOnOpen,
  rejectInvalidPhone,
  removeAddedPhone,
  restrictSearchedNumber,
  showErrors,
  startPhoneSearch,
  toggleCondition,
  type NumberRecordFormState,
} from "./numberRecordFormLogic";
import { saveNumberRecord } from "./numberRecordSave";
import {
  checkNumberRecordSubmission,
  hiddenNumberRecordErrorSlots,
  isRestrictionConflict,
  mapSaveErrorToSlots,
} from "./numberRecordValidation";
import { usePermitLookup } from "./source-restriction/usePermitLookup";

type StateTransition = (current: NumberRecordFormState) => NumberRecordFormState;

export interface ChooseRestrictionOptions {
  /**
   * אחרי הבחירה הפוקוס עובר לכותרת הבוחר, כדי שקורא מסך ישמיע שהבחירה נעשתה (ספק 04 form §4.5).
   * false - כשהמשתמש כבר העביר את הפוקוס בעצמו למקום אחר, ואין להחזיר אותו
   */
  shouldFocusPicker: boolean;
}

const MOVE_FOCUS_TO_PICKER: ChooseRestrictionOptions = { shouldFocusPicker: true };

interface UseNumberRecordFormOptions {
  traineeId: number;
  /** הפנימייה של החניך, לחיפוש ההגבלות הפנימייתיות */
  instituteId: number | null;
  /** רשומה חדשה, עריכה, או רשומה חדשה על בסיס רשומה שהסתיימה. ערכי הטופס נקבעים ממנה כשהטופס נפתח */
  startingPoint: FormStartingPoint<TraineePhoneRecordDto>;
  reasons: AsyncResource<LookupItem<number>[]>;
  /** אחרי שמירה מוצלחת, עם המפתח של הרשומה הראשונה שנשמרה */
  onSaved: (savedRecordKey: string) => void;
}

/** המצב וההתנהגות של טופס ההגבלה / ההיתר למספר (ספק 04 form §4) */
export function useNumberRecordForm({
  traineeId,
  instituteId,
  startingPoint,
  reasons,
  onSaved,
}: UseNumberRecordFormOptions) {
  const editedRecord = editedRecordOf(startingPoint);
  const sourceRecord = sourceRecordOf(startingPoint);
  const [state, setState] = useState(() => createInitialNumberRecordState(startingPoint, todayIsoDate()));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [hasUserChanges, setHasUserChanges] = useState(false);
  const focusAfterRender = useFocusAfterRender();
  const showSavedToast = useSaveSuccessToast();

  const update = (transition: StateTransition) => setState(transition);

  // שינוי ערך על ידי המשתמש. תוצאות חיפוש, ופתיחה וסגירה של אזורים, לא נחשבות שינוי
  const updateByUser = (transition: StateTransition) => {
    setState(transition);
    setHasUserChanges(true);
  };

  const permitLookup = usePermitLookup({
    traineeId,
    instituteId,
    onResults: (phone, results) => update((current) => completePhoneSearch(current, phone, results, todayIsoDate())),
    onFailure: (phone) => update((current) => failPhoneSearch(current, phone)),
  });

  // הרשומה שמורה עם שם הסיבה: כשרשימת הסיבות מגיעה, הסיבה נבחרת בה לפי השם
  useEffect(() => {
    const reasonList = reasons.data;
    if (!sourceRecord || !reasonList) return;
    setState((current) =>
      current.values.reasonId !== null
        ? current
        : { ...current, values: { ...current.values, reasonId: findReasonIdByName(reasonList, sourceRecord.reason) } },
    );
  }, [sourceRecord, reasons.data]);

  // היתר על בסיס היתר שהסתיים: המספר נבדק מיד כשהטופס נפתח.
  // בכל הרכבה מחדש החיפוש רץ שוב, כי ניקוי ההרכבה מבטל את החיפוש הקודם (usePermitLookup)
  const [phoneToSearch] = useState(() => phoneToSearchOnOpen(state));
  // רק בפתיחת הטופס - ולכן בלי תלויות
  useEffect(() => {
    if (phoneToSearch) {
      searchNumber(phoneToSearch);
    }
  }, []);

  // ── סוג הפעולה וחיפוש המספר ──

  const changeType = (recordType: TraineePhoneRecordType) => {
    permitLookup.cancel();
    updateByUser((current) => changeRecordType(current, recordType, todayIsoDate()));
  };

  const changePhone = (phoneDraft: string) => {
    permitLookup.cancel();
    updateByUser((current) => changePhoneDraft(current, phoneDraft));
  };

  // ספק 04 form §4.3: ריק - כלום; לא תקין - שגיאה בלי חיפוש; תקין - חיפוש
  function searchNumber(phone: PhoneString) {
    if (!phone) return;
    if (!isValidPhone(phone)) {
      update(rejectInvalidPhone);
      return;
    }
    update((current) => startPhoneSearch(current, phone));
    permitLookup.search(phone);
  }

  const searchPhone = () => searchNumber(normalizePhone(state.phoneDraft));

  const restrictNumber = () => {
    permitLookup.cancel();
    updateByUser((current) => restrictSearchedNumber(current, todayIsoDate()));
  };

  const choose = (
    restriction: SourceRestrictionSummaryDto,
    { shouldFocusPicker }: ChooseRestrictionOptions = MOVE_FOCUS_TO_PICKER,
  ) => {
    updateByUser((current) => chooseRestriction(current, restriction, todayIsoDate()));
    if (shouldFocusPicker) {
      focusAfterRender(RESTRICTION_PICKER_HEADING_ID);
    }
  };

  // ── שמירה (ספק 04 form §4.10) ──

  const saveRecord = async (submittedState: NumberRecordFormState) => {
    const decision = toValidatedDecision(submittedState.values, reasons.data ?? []);
    if (!decision) return null;
    return saveNumberRecord({ state: submittedState, decision, traineeId, record: editedRecord });
  };

  const handleSaveError = (error: unknown, submittedState: NumberRecordFormState) => {
    const appError = toAppError(error);
    const stateAfterError = isRestrictionConflict(appError, submittedState)
      ? markLookupOutdated(submittedState)
      : submittedState;
    const slotErrors = mapSaveErrorToSlots(appError, stateAfterError);
    const { visibleErrors, hasHiddenErrors } = splitByHiddenSlots(
      slotErrors,
      hiddenNumberRecordErrorSlots(stateAfterError),
    );
    if (hasErrors(visibleErrors)) {
      showSubmissionErrors(stateAfterError, visibleErrors);
    }
    if (hasHiddenErrors || !hasErrors(visibleErrors)) {
      setSaveError(FORM_TEXTS.saveFailed);
    }
  };

  const showSubmissionErrors = (submittedState: NumberRecordFormState, errors: NumberRecordFormState["errors"]) => {
    setState(showErrors(submittedState, errors));
    const firstErrorSlot = findFirstErrorSlot(errors, NUMBER_RECORD_ERROR_SLOTS);
    if (firstErrorSlot) {
      focusAfterRender(NUMBER_RECORD_FIELD_IDS[firstErrorSlot]);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSaving || isFileUploading) return;

    setSaveError(undefined);
    const { submittedState, errors } = checkNumberRecordSubmission(state);
    if (hasErrors(errors)) {
      showSubmissionErrors(submittedState, errors);
      return;
    }

    setState({ ...submittedState, errors: {} });
    setIsSaving(true);
    try {
      const savedRecord = await saveRecord(submittedState);
      if (savedRecord) {
        onSaved(buildNumberRecordKey(savedRecord));
        showSavedToast(buildSavedToast(submittedState, editedRecord !== null));
      }
    } catch (error) {
      handleSaveError(error, submittedState);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    state,
    isSaving,
    isFileUploading,
    saveError,
    /** המשתמש שינה ערך מאז שהטופס נפתח - כדי לשאול לפני שהטופס נסגר בלי כוונה */
    hasUserChanges,
    submit,
    setIsFileUploading,
    changeType,
    changePhone,
    searchPhone,
    addPhone: () => updateByUser(addPhoneFromDraft),
    removePhone: (phone: PhoneString) => updateByUser((current) => removeAddedPhone(current, phone)),
    restrictNumber,
    choose,
    openPicker: () => update(openRestrictionPicker),
    closePicker: () => update(closeRestrictionPicker),
    toggleCondition: (condition: PermittedCondition) => update((current) => toggleCondition(current, condition)),
    changeStartDate: (startDate: string) => updateByUser((current) => changeDate(current, "startDate", startDate)),
    changeEndDate: (endDate: string) => updateByUser((current) => changeDate(current, "endDate", endDate)),
    changeLimitKind: (limitKind: CallLimitKind) =>
      updateByUser((current) => changeFormValues(current, { limitKind }, ["duration"])),
    changeDurationText: (durationText: string) =>
      updateByUser((current) => changeFormValues(current, { durationText }, ["duration"])),
    changeStartTime: (startTime: string) =>
      updateByUser((current) => changeFormValues(current, { startTime }, ["hours"])),
    changeEndTime: (endTime: string) => updateByUser((current) => changeFormValues(current, { endTime }, ["hours"])),
    changeDeviceIds: (deviceIds: number[]) =>
      updateByUser((current) => changeFormValues(current, { deviceIds }, ["devices"])),
    changeDecision: (decisionUpdate: Partial<DecisionValues>) =>
      updateByUser((current) => changeFormValues(current, decisionUpdate, decisionErrorSlotsFor(decisionUpdate))),
  };
}

export type NumberRecordFormController = ReturnType<typeof useNumberRecordForm>;

/** הודעת השמירה: היתר, או הגבלה - וברבים כשהגבלה חדשה נשמרה לכמה מספרים (כל מספר כרשומה נפרדת) */
function buildSavedToast(submittedState: NumberRecordFormState, isEditMode: boolean): string {
  const toastTexts = NUMBER_RESTRICTIONS_TEXTS.form.savedToast;
  if (submittedState.recordType === "permit") {
    return toastTexts.permit;
  }
  const savedCount = isEditMode ? 1 : submittedState.addedPhones.length;
  return toastTexts.restriction(savedCount);
}
