import { useId } from "react";
import { IpsSelect } from "ui-library";
import FieldLabelText from "@/shared/components/form/FieldLabelText";
import type { SelectFieldProps } from "@/shared/components/form/formControls";
import { PLACEHOLDER_VALUE_SX } from "./pickerFieldOptions";

/**
 * בחירה יחידה בדסקטופ: IpsSelect, עם התווית מעל השדה (design.md).
 * ה-id על הכפתור שפותח את הרשימה, כדי שהטופס יוכל להעביר אליו פוקוס כשיש בו שגיאה.
 * הטקסט שמתחת לשדה (שגיאה, כשל טעינה) מוצג כאן ולא ב-IpsSelect, כדי שיהיה מקושר לשדה ויוקרא איתו -
 * הטקסט של IpsSelect בלי מזהה (pending-decisions › Selects – helper text not announced)
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
  const helperTextId = useId();
  const isEmpty = value === null;

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
        SelectDisplayProps={{
          id,
          "aria-required": required,
          "aria-describedby": helperText ? helperTextId : undefined,
        }}
        options={options}
        value={value ?? undefined}
        placeholder={placeholder}
        error={error}
        // שדה ריק: הטקסט "בחירת…" באפור, כמו במובייל (ספק 00 §3.11)
        sx={isEmpty ? PLACEHOLDER_VALUE_SX : undefined}
        onChange={handleChange}
      />
      {/* באותו מראה כמו הטקסט של MUI מתחת לשדה: 12, מוזח כמו הטקסט שבשדה */}
      {helperText && (
        <p id={helperTextId} className={`mx-3.5 mt-1 text-xs ${error ? "text-error" : "text-text-secondary"}`}>
          {helperText}
        </p>
      )}
    </div>
  );
}
