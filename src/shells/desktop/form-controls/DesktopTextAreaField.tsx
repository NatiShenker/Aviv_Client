import { useId } from "react";
import { IpsTextArea } from "ui-library";
import FieldLabelText from "@/shared/components/form/FieldLabelText";
import type { TextAreaFieldProps } from "@/shared/form-controls/formControls";

// שלוש שורות, כמו במובייל (ספק 00 §3.14)
const TEXT_AREA_ROWS = 3;

/** טקסט ארוך בדסקטופ: IpsTextArea לכל רוחב השורה (ולא ברוחב הקבוע שלו), עם התווית מעל השדה */
export default function DesktopTextAreaField({
  id,
  label,
  "aria-label": ariaLabel,
  required,
  error,
  helperText,
  value,
  onChange,
  placeholder,
}: TextAreaFieldProps) {
  const labelId = useId();

  return (
    <div className="min-w-0">
      {label && <FieldLabelText id={labelId} text={label} isRequired={required} />}
      <IpsTextArea
        id={id}
        fullWidth
        rows={TEXT_AREA_ROWS}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        error={error}
        helperText={helperText}
        inputProps={{ "aria-label": ariaLabel, "aria-labelledby": label && !ariaLabel ? labelId : undefined }}
      />
    </div>
  );
}
