import { useId } from "react";
import { IpsSelect } from "ui-library";
import FieldLabelText from "@/shared/components/form/FieldLabelText";
import type { FieldOption, FieldOptionValue, MultiSelectFieldProps } from "@/shared/components/form/formControls";
import { PLACEHOLDER_VALUE_SX } from "./pickerFieldOptions";

const DEFAULT_SELECTION_SEPARATOR = ", ";

function selectedLabelsOf(options: FieldOption[], selectedValues: FieldOptionValue[]): string[] {
  return options.filter((option) => selectedValues.includes(option.value)).map((option) => option.label);
}

/**
 * בחירה מרובה בדסקטופ: IpsSelect multiple (רשימה עם תיבות סימון, וכותרות קבוצה), עם התווית מעל השדה.
 * הערך הסגור לפי formatSelection של הטופס - למשל שם מכשיר אחד, או "{n} מכשירים" - ובלי בחירה ה-placeholder, באפור.
 * הטקסט שמתחת לשדה מוצג כאן ומקושר לשדה, כמו בבחירה יחידה (DesktopSelectField)
 */
export default function DesktopMultiSelectField({
  id,
  label,
  "aria-label": ariaLabel,
  required,
  error,
  helperText,
  options,
  value,
  onChange,
  formatSelection,
  placeholder,
}: MultiSelectFieldProps) {
  const labelId = useId();
  const helperTextId = useId();
  const isEmpty = value.length === 0;

  // renderValue שלנו מחליף את זה של IpsSelect, ולכן גם ה-placeholder מוצג כאן
  const renderSelection = () => {
    const selectedLabels = selectedLabelsOf(options, value);
    if (selectedLabels.length === 0) return placeholder ?? "";
    return formatSelection ? formatSelection(selectedLabels) : selectedLabels.join(DEFAULT_SELECTION_SEPARATOR);
  };

  return (
    <div className="min-w-0">
      {label && <FieldLabelText id={labelId} text={label} isRequired={required} />}
      <IpsSelect
        multiple
        labelId={label ? labelId : undefined}
        inputProps={ariaLabel ? { "aria-label": ariaLabel } : undefined}
        SelectDisplayProps={{
          id,
          "aria-required": required,
          "aria-describedby": helperText ? helperTextId : undefined,
        }}
        options={options}
        // IpsSelect מקבל מערך מסוג אחד; הערכים בטופס מסוג אחד (למשל מזהי מכשירים)
        value={value as number[]}
        // עם placeholder הפקד קורא ל-renderValue גם כשלא נבחר כלום (displayEmpty)
        placeholder={placeholder}
        renderValue={renderSelection}
        error={error}
        // בלי בחירה: הכלל ("כל המכשירים" / "לא הוגדרו") באפור, כדי שלא ייקרא כמכשיר שנבחר
        sx={isEmpty && placeholder ? PLACEHOLDER_VALUE_SX : undefined}
        onChange={(selectedValues) => onChange?.(Array.isArray(selectedValues) ? selectedValues : [])}
      />
      {helperText && (
        <p id={helperTextId} className={`mx-3.5 mt-1 text-xs ${error ? "text-error" : "text-text-secondary"}`}>
          {helperText}
        </p>
      )}
    </div>
  );
}
