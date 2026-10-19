import { useId } from "react";
import { IpsTimePicker } from "ui-library";
import FieldLabelText from "@/shared/components/form/FieldLabelText";
import type { TimeFieldProps } from "@/shared/form-controls/formControls";
import { TIME_DISPLAY_FORMAT, TIME_FIELD_PLACEHOLDERS } from "./pickerFieldOptions";
import { momentToTime, timeToMoment } from "./pickerValues";
import { usePickerDraft } from "./usePickerDraft";

/**
 * שדה שעה בדסקטופ: IpsTimePicker ב-24 שעות. עם clearButtonLabel יש כפתור ניקוי (ספק 00 §3.6),
 * עם השם הנגיש שהטופס נותן לו
 */
export default function DesktopTimeField({
  id,
  label,
  "aria-label": ariaLabel,
  required,
  error,
  helperText,
  value,
  onChange,
  clearButtonLabel,
}: TimeFieldProps) {
  const labelId = useId();
  const { draft, changeDraft } = usePickerDraft({
    value,
    toPickerValue: timeToMoment,
    fromPickerValue: momentToTime,
    onChange,
  });
  const isClearable = Boolean(clearButtonLabel);

  return (
    <div className="min-w-0">
      {label && <FieldLabelText id={labelId} text={label} isRequired={required} />}
      <IpsTimePicker
        value={draft}
        onChange={changeDraft}
        format={TIME_DISPLAY_FORMAT}
        ampm={false}
        localeText={{ ...TIME_FIELD_PLACEHOLDERS, fieldClearLabel: clearButtonLabel }}
        enableAccessibleFieldDOMStructure={false}
        error={error}
        helperText={helperText}
        slotProps={{
          field: { clearable: isClearable },
          textField: {
            id,
            fullWidth: true,
            inputProps: { "aria-labelledby": ariaLabel ? undefined : labelId, "aria-label": ariaLabel },
          },
        }}
      />
    </div>
  );
}
