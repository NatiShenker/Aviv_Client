import { useEffect, useState, type FormEvent } from "react";
import { toAppError } from "@/infrastructure/errors/appError";
import type { CallLimitKind, LookupItem } from "@/schemas/common.schema";
import type { TraineeRestrictionRecordDto } from "@/schemas/trainee-restrictions.schema";
import { createTraineeRestriction, updateTraineeRestriction } from "@/services/traineeRestrictionsService";
import type { DecisionValues } from "@/shared/components/form/DecisionBlock";
import { FORM_TEXTS } from "@/shared/components/form/formTexts";
import { todayIsoDate } from "@/shared/dates/isoDate";
import { focusField } from "@/shared/dom/focusField";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import {
  RESTRICTION_FIELD_IDS,
  buildCreateRestrictionRequest,
  buildUpdateRestrictionRequest,
  createInitialRestrictionValues,
  findFirstErrorSlot,
  findReasonIdByName,
  hasErrors,
  mapServerFieldErrors,
  toValidatedDecision,
  validateRestrictionForm,
  type RestrictionErrorSlot,
  type RestrictionFormErrors,
  type RestrictionFormValues,
} from "./restrictionFormLogic";

export type RestrictionCondition = "hours" | "devices";

type OpenConditions = Record<RestrictionCondition, boolean>;

interface TouchedDates {
  startDate: boolean;
  endDate: boolean;
}

/** אקורדיון שיש בו ערכים נפתח כשרשומה נפתחת לעריכה (ספק 03 form §4.1) */
function initialOpenConditions(record: TraineeRestrictionRecordDto | null): OpenConditions {
  return {
    hours: Boolean(record && (record.startTime || record.endTime)),
    devices: Boolean(record && record.devices.length > 0),
  };
}

// בעריכה התאריכים מוצגים רגיל; בהגבלה חדשה ברירות המחדל באפור עד שהמשתמש משנה אותן
function initialTouchedDates(record: TraineeRestrictionRecordDto | null): TouchedDates {
  return { startDate: record !== null, endDate: record !== null };
}

// השגיאה של כל שדה בבלוק "סיבות והחלטה" נמחקת כשהשדה משתנה
const DECISION_FIELD_ERROR_SLOT: Partial<Record<keyof DecisionValues, RestrictionErrorSlot>> = {
  reasonId: "reason",
  approver: "approver",
  approvedFile: "file",
};

interface UseRestrictionFormOptions {
  traineeId: number;
  /** הרשומה שבעריכה, או null בהגבלה חדשה. ערכי הטופס נקבעים ממנה כשהטופס נפתח */
  record: TraineeRestrictionRecordDto | null;
  reasons: AsyncResource<LookupItem<number>[]>;
  /** אחרי שמירה מוצלחת, עם מזהה הרשומה שנשמרה */
  onSaved: (savedRecordId: number) => void;
}

/** המצב וההתנהגות של טופס ההגבלה (ספק 03 form §4) */
export function useRestrictionForm({ traineeId, record, reasons, onSaved }: UseRestrictionFormOptions) {
  const [values, setValues] = useState(() => createInitialRestrictionValues(record, todayIsoDate()));
  const [errors, setErrors] = useState<RestrictionFormErrors>({});
  const [touchedDates, setTouchedDates] = useState(() => initialTouchedDates(record));
  const [openConditions, setOpenConditions] = useState(() => initialOpenConditions(record));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [slotToFocus, setSlotToFocus] = useState<RestrictionErrorSlot | null>(null);

  // הרשומה שמורה עם שם הסיבה: כשרשימת הסיבות מגיעה, הסיבה נבחרת בה לפי השם
  useEffect(() => {
    const reasonList = reasons.data;
    if (!record || !reasonList) return;
    setValues((current) =>
      current.reasonId !== null ? current : { ...current, reasonId: findReasonIdByName(reasonList, record.reason) },
    );
  }, [record, reasons.data]);

  // אחרי שהשגיאות הוצגו (ואקורדיון שיש בו שגיאה נפתח) - פוקוס וגלילה לשדה השגוי הראשון
  useEffect(() => {
    if (!slotToFocus) return;
    setSlotToFocus(null);
    focusField(RESTRICTION_FIELD_IDS[slotToFocus]);
  }, [slotToFocus]);

  const changeValues = (update: Partial<RestrictionFormValues>, clearedSlots: RestrictionErrorSlot[] = []) => {
    setValues((current) => ({ ...current, ...update }));
    if (clearedSlots.length > 0) {
      setErrors((current) => {
        const remaining = { ...current };
        clearedSlots.forEach((slot) => delete remaining[slot]);
        return remaining;
      });
    }
  };

  const showErrors = (nextErrors: RestrictionFormErrors) => {
    setErrors(nextErrors);
    setOpenConditions((current) => ({
      hours: current.hours || Boolean(nextErrors.hours),
      devices: current.devices || Boolean(nextErrors.devices),
    }));
    setSlotToFocus(findFirstErrorSlot(nextErrors));
  };

  const saveRestriction = async (formValues: RestrictionFormValues): Promise<number | null> => {
    const decision = toValidatedDecision(formValues, reasons.data ?? []);
    if (!decision) return null;

    const result = record
      ? await updateTraineeRestriction(buildUpdateRestrictionRequest(formValues, decision, record))
      : await createTraineeRestriction(buildCreateRestrictionRequest(formValues, decision, traineeId));
    return result.createdIds[0] ?? null;
  };

  const handleSaveError = (error: unknown) => {
    const appError = toAppError(error);
    const serverErrors = appError.code === "VALIDATION_ERROR" ? mapServerFieldErrors(appError.fieldErrors) : {};
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
    submit,
    setIsFileUploading,
    toggleCondition: (condition: RestrictionCondition) =>
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
    changeDecision: (update: Partial<DecisionValues>) => {
      const clearedSlots = Object.keys(update)
        .map((fieldName) => DECISION_FIELD_ERROR_SLOT[fieldName as keyof DecisionValues])
        .filter((slot): slot is RestrictionErrorSlot => slot !== undefined);
      changeValues(update, clearedSlots);
    },
  };
}

export type RestrictionForm = ReturnType<typeof useRestrictionForm>;
