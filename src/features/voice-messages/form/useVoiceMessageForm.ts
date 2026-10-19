import { useEffect, useState, type FormEvent } from "react";
import { touchedDatesFor } from "@/features/records/form/dateRangeLogic";
import {
  decisionErrorSlotsFor,
  findReasonIdByName,
  toValidatedDecision,
  type DecisionValues,
} from "@/features/records/form/decisionLogic";
import { findFirstErrorSlot, hasErrors, splitByHiddenSlots, withoutErrors } from "@/features/records/form/formErrors";
import { editedRecordOf, sourceRecordOf, type FormStartingPoint } from "@/features/records/form/formStartingPoint";
import { FORM_TEXTS } from "@/features/records/form/formTexts";
import { toAppError } from "@/infrastructure/errors/appError";
import type { LookupItem, PhoneString } from "@/schemas/common.schema";
import type { TraineeVoiceMessageRecordDto, VoiceMessageScope } from "@/schemas/voice-messages.schema";
import { createTraineeVoiceMessage, updateTraineeVoiceMessage } from "@/services/voiceMessagesService";
import { todayIsoDate } from "@/shared/dates/isoDate";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import { useFocusAfterRender } from "@/shared/hooks/useFocusAfterRender";
import {
  VOICE_MESSAGE_ERROR_SLOTS,
  VOICE_MESSAGE_FIELD_IDS,
  addDraftPhone,
  buildCreateVoiceMessageRequest,
  buildUpdateVoiceMessageRequest,
  checkVoiceMessageSubmission,
  createInitialVoiceMessageValues,
  hiddenVoiceMessageErrorSlots,
  mapVoiceMessageSaveError,
  type VoiceMessageErrorSlot,
  type VoiceMessageFormErrors,
  type VoiceMessageFormValues,
} from "./voiceMessageFormLogic";

interface UseVoiceMessageFormOptions {
  traineeId: number;
  /** הודעה חדשה, עריכה, או הודעה חדשה על בסיס הודעה שהסתיימה. ערכי הטופס נקבעים ממנה כשהטופס נפתח */
  startingPoint: FormStartingPoint<TraineeVoiceMessageRecordDto>;
  reasons: AsyncResource<LookupItem<number>[]>;
  /** אחרי שמירה מוצלחת, עם מזהה ההודעה הראשונה שנשמרה */
  onSaved: (savedRecordId: number) => void;
}

/** המצב וההתנהגות של טופס ההודעה לנמען (ספק 05 form §4) */
export function useVoiceMessageForm({ traineeId, startingPoint, reasons, onSaved }: UseVoiceMessageFormOptions) {
  const editedRecord = editedRecordOf(startingPoint);
  const sourceRecord = sourceRecordOf(startingPoint);
  const isEditMode = editedRecord !== null;
  const [values, setValues] = useState(() => createInitialVoiceMessageValues(startingPoint, todayIsoDate()));
  const [errors, setErrors] = useState<VoiceMessageFormErrors>({});
  const [touchedDates, setTouchedDates] = useState(() => touchedDatesFor(isEditMode));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  const [isFileUploading, setIsFileUploading] = useState(false);
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

  const changeValues = (update: Partial<VoiceMessageFormValues>, clearedSlots: VoiceMessageErrorSlot[] = []) => {
    setValues((current) => ({ ...current, ...update }));
    setErrors((current) => withoutErrors(current, clearedSlots));
  };

  const showErrors = (nextErrors: VoiceMessageFormErrors) => {
    setErrors(nextErrors);
    const firstErrorSlot = findFirstErrorSlot(nextErrors, VOICE_MESSAGE_ERROR_SLOTS);
    if (firstErrorSlot) {
      focusAfterRender(VOICE_MESSAGE_FIELD_IDS[firstErrorSlot]);
    }
  };

  // ── היקף ומספרים (ספק 05 form §4.2-4.3) ──

  // המספרים שנוספו נשמרים גם כשעוברים ל"בכל השיחות"; מעבר למספרים נבחרים מעביר את הפוקוס לשדה המספר
  const changeScope = (scope: VoiceMessageScope) => {
    changeValues({ scope }, ["phone"]);
    if (scope === "selected") {
      focusAfterRender(VOICE_MESSAGE_FIELD_IDS.phone);
    }
  };

  const addPhone = () => {
    const outcome = addDraftPhone(values);
    if ("error" in outcome) {
      setErrors((current) => ({ ...current, phone: outcome.error }));
      return;
    }
    setValues(outcome.values);
  };

  const removePhone = (phone: PhoneString) => {
    changeValues({ phones: values.phones.filter((addedPhone) => addedPhone !== phone) });
  };

  // ── שמירה (ספק 05 form §4.5) ──

  const saveVoiceMessage = async (formValues: VoiceMessageFormValues): Promise<number | null> => {
    const decision = toValidatedDecision(formValues, reasons.data ?? []);
    if (!decision) return null;

    const result = editedRecord
      ? await updateTraineeVoiceMessage(buildUpdateVoiceMessageRequest(formValues, decision, editedRecord))
      : await createTraineeVoiceMessage(buildCreateVoiceMessageRequest(formValues, decision, traineeId));
    // כמה מספרים נשמרים כמה הודעות - הראשונה תוצג פתוחה
    return result.createdIds[0] ?? null;
  };

  const handleSaveError = (error: unknown, submittedValues: VoiceMessageFormValues) => {
    const serverErrors = mapVoiceMessageSaveError(toAppError(error));
    const { visibleErrors, hasHiddenErrors } = splitByHiddenSlots(
      serverErrors,
      hiddenVoiceMessageErrorSlots(submittedValues, isEditMode),
    );
    if (hasErrors(visibleErrors)) {
      showErrors(visibleErrors);
    }
    if (hasHiddenErrors || !hasErrors(visibleErrors)) {
      setSaveError(FORM_TEXTS.saveFailed);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSaving || isFileUploading) return;

    setSaveError(undefined);
    const { submittedValues, errors: validationErrors } = checkVoiceMessageSubmission(values, isEditMode);
    // מספר תקין שנשאר בשדה נוסף לרשימה גם כשיש שגיאות אחרות
    setValues(submittedValues);
    if (hasErrors(validationErrors)) {
      showErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      const savedRecordId = await saveVoiceMessage(submittedValues);
      if (savedRecordId !== null) {
        onSaved(savedRecordId);
      }
    } catch (error) {
      handleSaveError(error, submittedValues);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    values,
    errors,
    touchedDates,
    isSaving,
    isFileUploading,
    saveError,
    submit,
    setIsFileUploading,
    changeScope,
    changePhoneDraft: (phoneDraft: string) => changeValues({ phoneDraft }, ["phone"]),
    addPhone,
    removePhone,
    changeRepeatDuringCall: (repeatDuringCall: boolean) => changeValues({ repeatDuringCall }),
    changeStartDate: (startDate: string) => {
      changeValues({ startDate }, ["dates"]);
      setTouchedDates((current) => ({ ...current, startDate: true }));
    },
    changeEndDate: (endDate: string) => {
      changeValues({ endDate }, ["dates"]);
      setTouchedDates((current) => ({ ...current, endDate: true }));
    },
    changeDecision: (update: Partial<DecisionValues>) => changeValues(update, decisionErrorSlotsFor(update)),
  };
}

export type VoiceMessageFormController = ReturnType<typeof useVoiceMessageForm>;
