import { useId } from "react";
import { IpsSwitch } from "ui-library";
import DateRangeField from "@/features/records/form/DateRangeField";
import FormSection from "@/shared/components/form/FormSection";
import { VOICE_MESSAGES_TEXTS } from "../voiceMessagesTexts";
import type { VoiceMessageFormController } from "./useVoiceMessageForm";
import { VOICE_MESSAGE_FIELD_IDS } from "./voiceMessageFormLogic";

const TEXTS = VOICE_MESSAGES_TEXTS.form.detailsBlock;

// מידות המתג לפי ספק 00 §3.17: מסלול 48×24 וכפתור 20 בתוכו.
// IpsSwitch קיים בספרייה לפני Aviv, ולכן ההתאמה נעשית כאן, במקום השימוש היחיד (ראו ui_library.md)
const SWITCH_TRACK_WIDTH_PX = 48;
const SWITCH_TRACK_HEIGHT_PX = 24;
const SWITCH_THUMB_SIZE_PX = 20;
const SWITCH_THUMB_INSET_PX = (SWITCH_TRACK_HEIGHT_PX - SWITCH_THUMB_SIZE_PX) / 2;
const SWITCH_THUMB_TRAVEL_PX = SWITCH_TRACK_WIDTH_PX - SWITCH_THUMB_SIZE_PX - SWITCH_THUMB_INSET_PX * 2;

// ערכת הנושא של הספרייה ממקמת את הכפתור ב-margin (ולא ב-padding), ולכן גם כאן: padding אפס, והמרווח ב-margin
const MOBILE_SWITCH_SX = {
  width: SWITCH_TRACK_WIDTH_PX,
  height: SWITCH_TRACK_HEIGHT_PX,
  padding: 0,
  flexShrink: 0,
  "& .MuiSwitch-switchBase": {
    padding: 0,
    margin: `${SWITCH_THUMB_INSET_PX}px`,
    "&.Mui-checked": {
      transform: `translateX(${SWITCH_THUMB_TRAVEL_PX}px)`,
      color: "common.white",
      "& + .MuiSwitch-track": { backgroundColor: "primary.main", opacity: 1 },
    },
  },
  "& .MuiSwitch-thumb": { width: SWITCH_THUMB_SIZE_PX, height: SWITCH_THUMB_SIZE_PX },
  "& .MuiSwitch-track": {
    borderRadius: SWITCH_TRACK_HEIGHT_PX / 2,
    backgroundColor: "var(--color-border-strong)",
    opacity: 1,
  },
} as const;

interface MessageDetailsBlockProps {
  form: VoiceMessageFormController;
}

/**
 * בלוק "פרטי ההודעה": קודם הסוג (הודעה חוזרת) ואז טווח התאריכים - מה ואז מתי, כמו בכל הפעולות.
 * החזרה היא מתג, כי לרוב היא נשארת כבויה ואין צורך לבחור בה במודע.
 */
export default function MessageDetailsBlock({ form }: MessageDetailsBlockProps) {
  const { values, errors } = form;
  const switchId = useId();
  const hintId = useId();

  return (
    <FormSection title={TEXTS.title}>
      {/* שורת הגדרה כמו במובייל: הטקסט מימין, המתג בקצה השמאלי */}
      <div className="flex items-start justify-between gap-4">
        <label htmlFor={switchId} className="flex min-w-0 flex-col">
          <span className="text-base text-text-primary">{TEXTS.repeatLabel}</span>
          <span id={hintId} className="text-sm text-text-muted">
            {TEXTS.repeatHint}
          </span>
        </label>
        <IpsSwitch
          id={switchId}
          checked={values.repeatDuringCall}
          onChange={(event) => form.changeRepeatDuringCall(event.target.checked)}
          slotProps={{ input: { "aria-describedby": hintId } }}
          sx={MOBILE_SWITCH_SX}
        />
      </div>

      <div className="mt-4">
        <DateRangeField
          description={TEXTS.dateRangeDescription}
          values={values}
          touchedDates={form.touchedDates}
          error={errors.dates}
          startDateInputId={VOICE_MESSAGE_FIELD_IDS.dates}
          onStartDateChange={form.changeStartDate}
          onEndDateChange={form.changeEndDate}
        />
      </div>
    </FormSection>
  );
}
