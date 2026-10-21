import { useId } from "react";
import { he } from "date-fns/locale";
import { IpsDatePicker } from "ui-library";
import FieldLabelText from "@/shared/components/form/FieldLabelText";
import type { DateFieldProps } from "@/shared/components/form/formControls";
import { DATE_DISPLAY_FORMAT, DATE_FIELD_LOCALE_TEXT, MUTED_VALUE_SX } from "./pickerFieldOptions";
import { dateToIsoDate, isoDateToDate } from "./pickerValues";
import { usePickerDraft } from "./usePickerDraft";

/**
 * שדה תאריך בדסקטופ: IpsDatePicker - הקלדה או לוח שנה בעברית. התווית מעל השדה (design.md),
 * והשדה הוא input רגיל עם ה-id, כדי שהטופס יוכל להעביר אליו פוקוס כשיש בו שגיאה
 */
export default function DesktopDateField({
  id,
  label,
  "aria-label": ariaLabel,
  required,
  error,
  helperText,
  value,
  onChange,
  min,
  max,
  muted,
}: DateFieldProps) {
  const labelId = useId();
  const { draft, changeDraft } = usePickerDraft({
    value,
    toPickerValue: isoDateToDate,
    fromPickerValue: dateToIsoDate,
    onChange,
  });

  return (
    <div className="min-w-0">
      {label && <FieldLabelText id={labelId} text={label} isRequired={required} />}
      <IpsDatePicker
        value={draft}
        onChange={changeDraft}
        minDate={isoDateToDate(min ?? "") ?? undefined}
        maxDate={isoDateToDate(max ?? "") ?? undefined}
        format={DATE_DISPLAY_FORMAT}
        locale={he}
        localeText={DATE_FIELD_LOCALE_TEXT}
        enableAccessibleFieldDOMStructure={false}
        error={error}
        helperText={helperText}
        slotProps={{
          textField: {
            id,
            fullWidth: true,
            inputProps: {
              "aria-labelledby": ariaLabel ? undefined : labelId,
              "aria-label": ariaLabel,
              "aria-required": required,
            },
          },
        }}
        sx={muted ? MUTED_VALUE_SX : undefined}
      />
    </div>
  );
}
