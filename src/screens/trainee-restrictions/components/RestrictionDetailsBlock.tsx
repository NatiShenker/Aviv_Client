import { IpsDatePickerMobile } from "ui-library";
import ErrorText from "@/shared/components/form/ErrorText";
import FieldIntro from "@/shared/components/form/FieldIntro";
import FormSection from "@/shared/components/form/FormSection";
import LimitTypeSelector from "@/shared/components/form/LimitTypeSelector";
import { formatShortDate } from "@/shared/formatting/dateFormat";
import { RESTRICTION_FIELD_IDS } from "../restrictionFormLogic";
import { TRAINEE_RESTRICTIONS_TEXTS } from "../traineeRestrictionsTexts";
import type { RestrictionForm } from "../useRestrictionForm";

const TEXTS = TRAINEE_RESTRICTIONS_TEXTS.form.detailsBlock;

interface RestrictionDetailsBlockProps {
  form: RestrictionForm;
}

/** בלוק 1 - "פרטי ההגבלה": טווח תאריכים וסוג ההגבלה (ספק 03 form §3.2) */
export default function RestrictionDetailsBlock({ form }: RestrictionDetailsBlockProps) {
  const { values, errors, touchedDates } = form;
  const hasDatesError = Boolean(errors.dates);

  return (
    <FormSection title={TEXTS.title}>
      <FieldIntro title={TEXTS.dateRangeTitle} description={TEXTS.dateRangeDescription} />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <IpsDatePickerMobile
          id={RESTRICTION_FIELD_IDS.dates}
          label={TEXTS.startDate}
          aria-label={TEXTS.startDate}
          placeholder={TEXTS.datePlaceholder}
          value={values.startDate}
          formatValue={formatShortDate}
          muted={!touchedDates.startDate}
          error={hasDatesError}
          onChange={form.changeStartDate}
        />
        {/* תאריך הסיום לא יכול להיות לפני תאריך ההתחלה; לתאריך ההתחלה אין מינימום (OQ-14) */}
        <IpsDatePickerMobile
          label={TEXTS.endDate}
          aria-label={TEXTS.endDate}
          placeholder={TEXTS.datePlaceholder}
          value={values.endDate}
          min={values.startDate || undefined}
          formatValue={formatShortDate}
          muted={!touchedDates.endDate}
          error={hasDatesError}
          onChange={form.changeEndDate}
        />
      </div>
      <ErrorText message={errors.dates} />

      <div className="mt-4">
        <LimitTypeSelector
          context="restriction"
          kind={values.limitKind}
          onKindChange={form.changeLimitKind}
          durationText={values.durationText}
          onDurationTextChange={form.changeDurationText}
          durationError={errors.duration}
          durationInputId={RESTRICTION_FIELD_IDS.duration}
        />
      </div>
    </FormSection>
  );
}
