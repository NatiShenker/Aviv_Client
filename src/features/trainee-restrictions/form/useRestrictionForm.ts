import { useEffect, useState, type FormEvent } from "react";
import { openConditionsForRecord, type PermittedCondition } from "@/features/records/form/call-conditions/callConditionsLogic";
import { touchedDatesFor } from "@/features/records/form/dateRangeLogic";
import {
  decisionErrorSlotsFor,
  findReasonIdByName,
  toValidatedDecision,
  type DecisionValues,
} from "@/features/records/form/decision/decisionLogic";
import { findFirstErrorSlot, hasErrors, withoutErrors } from "@/features/records/form/formErrors";
import { editedRecordOf, sourceRecordOf, type FormStartingPoint } from "@/features/records/form/formStartingPoint";
import { FORM_TEXTS } from "@/features/records/form/formTexts";
import { toAppError } from "@/infrastructure/errors/appError";
import { createTraineeRestriction, updateTraineeRestriction } from "@/services/traineeRestrictionsService";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import { useFocusAfterRender } from "@/shared/hooks/useFocusAfterRender";
import type { CallLimitKind, LookupItem } from "@/types/common.schema";
import type { TraineeRestrictionRecordDto } from "@/types/trainee-restrictions.schema";
import { todayIsoDate } from "@/utils/dates";
import {
  RESTRICTION_ERROR_SLOTS,
  RESTRICTION_FIELD_IDS,
  buildCreateRestrictionRequest,
  buildUpdateRestrictionRequest,
  createInitialRestrictionValues,
  mapRestrictionServerErrors,
  validateRestrictionForm,
  type RestrictionErrorSlot,
  type RestrictionFormErrors,
  type RestrictionFormValues,
} from "./restrictionFormLogic";

interface UseRestrictionFormOptions {
  traineeId: number;
  /** הגבלה חדשה, עריכה, או הגבלה חדשה על בסיס רשומה שהסתיימה. ערכי הטופס נקבעים ממנה כשהטופס נפתח */
  startingPoint: FormStartingPoint<TraineeRestrictionRecordDto>;
  reasons: AsyncResource<LookupItem<number>[]>;
  /** אחרי שמירה מוצלחת, עם מזהה הרשומה שנשמרה */
  onSaved: (savedRecordId: number) => void;
}

/** המצב וההתנהגות של טופס ההגבלה (ספק 03 form §4) */
export function useRestrictionForm({ traineeId, startingPoint, reasons, onSaved }: UseRestrictionFormOptions) {
  const editedRecord = editedRecordOf(startingPoint);
  const sourceRecord = sourceRecordOf(startingPoint);
  const [values, setValues] = useState(() => createInitialRestrictionValues(startingPoint, todayIsoDate()));
  const [errors, setErrors] = useState<RestrictionFormErrors>({});
  const [touchedDates, setTouchedDates] = useState(() => touchedDatesFor(editedRecord !== null));
  const [openConditions, setOpenConditions] = useState(() => openConditionsForRecord(sourceRecord));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [hasUserChanges, setHasUserChanges] = useState(false);
  const focusAfterRender = useFocusAfterRender();

  // הרשומה שמורה עם שם הסיבה: כשרשימת הסיבות מגיעה, הסיבה נבחרת בה לפי השם
  useEffect(() => {
    const reasonList = reasons.data;
    if (!sourceRecord || !reasonList) return;
    setValues((current) =>
      current.reasonId !== null
        ? current
        : { ...current, reasonId: findReasonIdByName(reasonList, sourceRecord.reason) },
    );
  }, [sourceRecord, reasons.data]);

  // כל שינוי של המשתמש עובר כאן (בחירת הסיבה לפי השם, כשהרשימה מגיעה, לא נחשבת שינוי)
  const changeValues = (update: Partial<RestrictionFormValues>, clearedSlots: RestrictionErrorSlot[] = []) => {
    setValues((current) => ({ ...current, ...update }));
    setErrors((current) => withoutErrors(current, clearedSlots));
    setHasUserChanges(true);
  };

  const showErrors = (nextErrors: RestrictionFormErrors) => {
    setErrors(nextErrors);
    setOpenConditions((current) => ({
      hours: current.hours || Boolean(nextErrors.hours),
      devices: current.devices || Boolean(nextErrors.devices),
    }));
    const firstErrorSlot = findFirstErrorSlot(nextErrors, RESTRICTION_ERROR_SLOTS);
    if (firstErrorSlot) {
      focusAfterRender(RESTRICTION_FIELD_IDS[firstErrorSlot]);
    }
  };

  const saveRestriction = async (formValues: RestrictionFormValues): Promise<number | null> => {
    const decision = toValidatedDecision(formValues, reasons.data ?? []);
    if (!decision) return null;

    const result = editedRecord
      ? await updateTraineeRestriction(buildUpdateRestrictionRequest(formValues, decision, editedRecord))
      : await createTraineeRestriction(buildCreateRestrictionRequest(formValues, decision, traineeId));
    return result.createdIds[0] ?? null;
  };

  const handleSaveError = (error: unknown) => {
    const appError = toAppError(error);
    const serverErrors = appError.code === "VALIDATION_ERROR" ? mapRestrictionServerErrors(appError.fieldErrors) : {};
    if (hasErrors(serverErrors)) {
      showErrors(serverErrors);
    } else {
      setSaveError(FORM_TEXTS.saveFailed);
    }
  };

  // ספק 03 form §4.7: כל הכללים רצים יחד; עם שגיאות - לא נשמר כלום
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSaving || isFileUploading) return;

    setSaveError(undefined);
    const validationErrors = validateRestrictionForm(values);
    if (hasErrors(validationErrors)) {
      showErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      const savedRecordId = await saveRestriction(values);
      if (savedRecordId !== null) {
        onSaved(savedRecordId);
      }
    } catch (error) {
      handleSaveError(error);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    values,
    errors,
    touchedDates,
    openConditions,
    isSaving,
    isFileUploading,
    saveError,
    /** המשתמש שינה ערך מאז שהטופס נפתח - כדי לשאול לפני שהטופס נסגר בלי כוונה */
    hasUserChanges,
    submit,
    setIsFileUploading,
    toggleCondition: (condition: PermittedCondition) =>
      setOpenConditions((current) => ({ ...current, [condition]: !current[condition] })),
    changeStartDate: (startDate: string) => {
      changeValues({ startDate }, ["dates"]);
      setTouchedDates((current) => ({ ...current, startDate: true }));
    },
    changeEndDate: (endDate: string) => {
      changeValues({ endDate }, ["dates"]);
      setTouchedDates((current) => ({ ...current, endDate: true }));
    },
    changeLimitKind: (limitKind: CallLimitKind) => changeValues({ limitKind }, ["duration"]),
    changeDurationText: (durationText: string) => changeValues({ durationText }, ["duration"]),
    changeStartTime: (startTime: string) => changeValues({ startTime }, ["hours"]),
    changeEndTime: (endTime: string) => changeValues({ endTime }, ["hours"]),
    changeDeviceIds: (deviceIds: number[]) => changeValues({ deviceIds }, ["devices"]),
    changeDecision: (update: Partial<DecisionValues>) => changeValues(update, decisionErrorSlotsFor(update)),
  };
}

export type RestrictionFormController = ReturnType<typeof useRestrictionForm>;
