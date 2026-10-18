import { IpsDatePickerMobile } from "ui-library";
import type { CallLimitKind, ISODateString } from "@/schemas/common.schema";
import { formatShortDate } from "@/shared/formatting/dateFormat";
import type { CallConditionsValues, CallRuleKind, TouchedDates } from "@/shared/restrictions/callConditionsLogic";
import ErrorText from "./ErrorText";
import FieldIntro from "./FieldIntro";
import FormSection from "./FormSection";
import { FORM_TEXTS } from "./formTexts";
import LimitTypeSelector from "./LimitTypeSelector";

const TEXTS = FORM_TEXTS.dateRange;

/** טווח מותר לתאריכים (בהיתר: תקופת ההגבלה שעליה הוא יושב) */
export interface DateBounds {
  min: ISODateString;
  max: ISODateString;
}

interface CallDetailsBlockProps {
  title: string;
  dateRangeDescription: string;
  ruleKind: CallRuleKind;
  values: CallConditionsValues;
  touchedDates: TouchedDates;
  errors: { dates?: string; duration?: string };
  /** בלי גבולות - לתאריך ההתחלה אין מינימום (OQ-14), ותאריך הסיום לא לפני תאריך ההתחלה */
  dateBounds?: DateBounds | null;
  /** מזהי השדות, כדי שהטופס יוכל להעביר פוקוס לשדה עם שגיאה */
  fieldIds: { dates: string; duration: string };
  onStartDateChange: (startDate: string) => void;
  onEndDateChange: (endDate: string) => void;
  onLimitKindChange: (limitKind: CallLimitKind) => void;
  onDurationTextChange: (durationText: string) => void;
}

/** בלוק "פרטי ההגבלה" / "פרטי ההיתר": טווח תאריכים וסוג (ספק 03 form §3.2, ספק 04 form §3.4) */
export default function CallDetailsBlock({
  title,
  dateRangeDescription,
  ruleKind,
  values,
  touchedDates,
  errors,
  dateBounds,
  fieldIds,
  onStartDateChange,
  onEndDateChange,
  onLimitKindChange,
  onDurationTextChange,
}: CallDetailsBlockProps) {
  const hasDatesError = Boolean(errors.dates);
  const endDateMin = values.startDate || dateBounds?.min;

  return (
    <FormSection title={title}>
      <FieldIntro title={TEXTS.title} description={dateRangeDescription} />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <IpsDatePickerMobile
          id={fieldIds.dates}
          label={TEXTS.startDate}
          aria-label={TEXTS.startDate}
          placeholder={TEXTS.placeholder}
          value={values.startDate}
          min={dateBounds?.min}
          max={dateBounds?.max}
          formatValue={formatShortDate}
          muted={!touchedDates.startDate}
          error={hasDatesError}
          onChange={onStartDateChange}
        />
        <IpsDatePickerMobile
          label={TEXTS.endDate}
          aria-label={TEXTS.endDate}
          placeholder={TEXTS.placeholder}
          value={values.endDate}
          min={endDateMin || undefined}
          max={dateBounds?.max}
          formatValue={formatShortDate}
          muted={!touchedDates.endDate}
          error={hasDatesError}
          onChange={onEndDateChange}
        />
      </div>
      <ErrorText message={errors.dates} />

      <div className="mt-4">
        <LimitTypeSelector
          context={ruleKind}
          kind={values.limitKind}
          onKindChange={onLimitKindChange}
          durationText={values.durationText}
          onDurationTextChange={onDurationTextChange}
          durationError={errors.duration}
          durationInputId={fieldIds.duration}
        />
      </div>
    </FormSection>
  );
}
