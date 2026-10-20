import { useId } from "react";
import { IpsSelect } from "ui-library";
import FieldLabelText from "@/shared/components/form/FieldLabelText";
import type { SelectFieldProps } from "@/shared/components/form/formControls";

/**
 * בחירה יחידה בדסקטופ: IpsSelect, עם התווית מעל השדה (design.md).
 * ה-id על הכפתור שפותח את הרשימה, כדי שהטופס יוכל להעביר אליו פוקוס כשיש בו שגיאה
 */
export default function DesktopSelectField({
  id,
  label,
  "aria-label": ariaLabel,
  required,
  error,
  helperText,
  options,
  value,
  onChange,
  placeholder,
}: SelectFieldProps) {
  const labelId = useId();

  // הפקד מחזיר ערך כללי; בבחירה יחידה זה הערך המקורי של האפשרות
  const handleChange = (selectedValue: unknown) => {
    if (typeof selectedValue === "string" || typeof selectedValue === "number") {
      onChange?.(selectedValue);
    }
  };

  return (
    <div className="min-w-0">
      {label && <FieldLabelText id={labelId} text={label} isRequired={required} />}
      <IpsSelect
        labelId={label ? labelId : undefined}
        // aria-label חייב לעבור דרך inputProps: ברמה העליונה הוא נוחת על העוטף ולא על הפקד
        inputProps={ariaLabel ? { "aria-label": ariaLabel } : undefined}
        SelectDisplayProps={id ? { id } : undefined}
        options={options}
        value={value ?? undefined}
        placeholder={placeholder}
        error={error}
        helperText={helperText}
        onChange={handleChange}
      />
    </div>
  );
}
