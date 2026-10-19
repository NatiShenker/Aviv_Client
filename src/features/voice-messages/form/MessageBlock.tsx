import { IpsRadioGroupMobile, type IpsRadioGroupMobileValue } from "ui-library";
import PhoneNumbersField from "@/features/records/form/phone/PhoneNumbersField";
import type { TraineeVoiceMessageRecordDto } from "@/schemas/voice-messages.schema";
import FieldIntro from "@/shared/components/form/FieldIntro";
import FormSection from "@/shared/components/form/FormSection";
import { VOICE_MESSAGES_TEXTS } from "../voiceMessagesTexts";
import LockedScopeCard from "./LockedScopeCard";
import type { VoiceMessageFormController } from "./useVoiceMessageForm";
import { VOICE_MESSAGE_FIELD_IDS } from "./voiceMessageFormLogic";
import { SCOPE_OPTIONS, isVoiceMessageScope } from "./voiceMessagesOptions";

const TEXTS = VOICE_MESSAGES_TEXTS.form.messageBlock;

interface MessageBlockProps {
  form: VoiceMessageFormController;
  /** בעריכה ההיקף והמספר נעולים, ובמקום הבחירה מוצג כרטיס נעול */
  editRecord: TraineeVoiceMessageRecordDto | null;
  traineeFullName: string;
}

/** בלוק "ההודעה": התוכן הקבוע, ואיפה ההודעה תושמע - בכל השיחות או במספרים נבחרים (ספק 05 form §3.2) */
export default function MessageBlock({ form, editRecord, traineeFullName }: MessageBlockProps) {
  return (
    <FormSection title={TEXTS.title}>
      <MessageContentBox traineeFullName={traineeFullName} />
      <div className="mt-4">{editRecord ? <LockedScopeCard record={editRecord} /> : <ScopeSelector form={form} />}</div>
    </FormSection>
  );
}

// התוכן קבוע ולקריאה בלבד; את הקול מפיקה מערכת הצד השלישי
function MessageContentBox({ traineeFullName }: { traineeFullName: string }) {
  return (
    <div className="rounded-input border border-border-strong bg-grey-50 px-4 py-2 text-base text-text-primary">
      <p className="font-medium">{TEXTS.contentLabel}</p>
      <p>{TEXTS.content(traineeFullName)}</p>
    </div>
  );
}

/** "היקף ההפעלה", ושדה המספרים מתחת לאפשרות שפותחת אותו */
function ScopeSelector({ form }: { form: VoiceMessageFormController }) {
  const { values, errors } = form;

  const handleScopeChange = (value: IpsRadioGroupMobileValue) => {
    if (isVoiceMessageScope(value)) {
      form.changeScope(value);
    }
  };

  return (
    <div>
      <FieldIntro title={TEXTS.scopeTitle} />
      <div className="mt-2">
        <IpsRadioGroupMobile
          aria-label={TEXTS.scopeTitle}
          options={SCOPE_OPTIONS}
          value={values.scope}
          onChange={handleScopeChange}
        />
      </div>

      {values.scope === "selected" && (
        <div className="mt-3 motion-safe:animate-fade-in">
          <PhoneNumbersField
            id={VOICE_MESSAGE_FIELD_IDS.phone}
            hint={TEXTS.phoneHint}
            value={values.phoneDraft}
            onChange={form.changePhoneDraft}
            error={errors.phone}
            phones={values.phones}
            onAdd={form.addPhone}
            onRemove={form.removePhone}
          />
        </div>
      )}
    </div>
  );
}
