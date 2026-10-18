import { IpsDatePickerMobile } from "ui-library";
import type { ISODateString } from "@/schemas/common.schema";
import ErrorText from "@/shared/components/form/ErrorText";
import FieldIntro from "@/shared/components/form/FieldIntro";
import { formatShortDate } from "@/shared/formatting/dateFormat";
import type { DateRangeValues, TouchedDates } from "./dateRangeLogic";
import { FORM_TEXTS } from "./formTexts";

const TEXTS = FORM_TEXTS.dateRange;

/** טווח מותר לתאריכים (בהיתר: תקופת ההגבלה שעליה הוא יושב) */
export interface DateBounds {
  min: ISODateString;
  max: ISODateString;
}

interface DateRangeFieldProps {
  /** מה הטווח קובע, למשל "ההגבלה תחול בתאריכים אלו בלבד" */
  description: string;
  values: DateRangeValues;
  touchedDates: TouchedDates;
  error?: string;
  /** בלי גבולות - לתאריך ההתחלה אין מינימום (OQ-14), ותאריך הסיום לא לפני תאריך ההתחלה */
  dateBounds?: DateBounds | null;
  /** מזהה שדה תאריך ההתחלה, כדי שהטופס יוכל להעביר אליו פוקוס כשיש שגיאה */
  startDateInputId: string;
  onStartDateChange: (startDate: string) => void;
  onEndDateChange: (endDate: string) => void;
}

/** "טווח תאריכים": כותרת והסבר, תאריך התחלה וסיום זה לצד זה, ושגיאה (ספק 00 §3.6, §4.2) */
export default function DateRangeField({
  description,
  values,
  touchedDates,
  error,
  dateBounds,
  startDateInputId,
  onStartDateChange,
  onEndDateChange,
}: DateRangeFieldProps) {
  const hasError = Boolean(error);
  const endDateMin = values.startDate || dateBounds?.min;

  return (
    <div>
      <FieldIntro title={TEXTS.title} description={description} />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <IpsDatePickerMobile
          id={startDateInputId}
          label={TEXTS.startDate}
          aria-label={TEXTS.startDate}
          placeholder={TEXTS.placeholder}
          value={values.startDate}
          min={dateBounds?.min}
          max={dateBounds?.max}
          formatValue={formatShortDate}
          muted={!touchedDates.startDate}
          error={hasError}
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
          error={hasError}
          onChange={onEndDateChange}
        />
      </div>
      <ErrorText message={error} />
    </div>
  );
}
