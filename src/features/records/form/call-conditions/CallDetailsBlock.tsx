import FormSection from "@/shared/components/form/FormSection";
import type { CallLimitKind } from "@/types/common.schema";
import DateRangeField from "../DateRangeField";
import type { DateBounds, TouchedDates } from "../dateRangeLogic";
import type { CallConditionsValues, CallRuleKind } from "./callConditionsLogic";
import LimitTypeSelector from "./LimitTypeSelector";

interface CallDetailsBlockProps {
  title: string;
  /** שורת ההסבר של טווח התאריכים. בלעדיה - רק הכותרת */
  dateRangeDescription?: string;
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

/**
 * בלוק "פרטי ההגבלה" / "פרטי ההיתר": קודם הסוג ואז טווח התאריכים - מה ואז מתי, כמו בכל הפעולות
 * (ספק 03 form §3.2, ספק 04 form §3.4)
 */
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
  return (
    <FormSection title={title}>
      <LimitTypeSelector
        context={ruleKind}
        kind={values.limitKind}
        onKindChange={onLimitKindChange}
        durationText={values.durationText}
        onDurationTextChange={onDurationTextChange}
        durationError={errors.duration}
        durationInputId={fieldIds.duration}
      />

      <div className="mt-4">
        <DateRangeField
          description={dateRangeDescription}
          values={values}
          touchedDates={touchedDates}
          error={errors.dates}
          dateBounds={dateBounds}
          startDateInputId={fieldIds.dates}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
        />
      </div>
    </FormSection>
  );
}
