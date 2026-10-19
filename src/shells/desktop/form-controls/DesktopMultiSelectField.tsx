import { useId } from "react";
import { IpsSelect } from "ui-library";
import FieldLabelText from "@/shared/components/form/FieldLabelText";
import type { FieldOption, FieldOptionValue, MultiSelectFieldProps } from "@/shared/form-controls/formControls";

const DEFAULT_SELECTION_SEPARATOR = ", ";

function selectedLabelsOf(options: FieldOption[], selectedValues: FieldOptionValue[]): string[] {
  return options.filter((option) => selectedValues.includes(option.value)).map((option) => option.label);
}

/**
 * בחירה מרובה בדסקטופ: IpsSelect multiple (רשימה עם תיבות סימון, וכותרות קבוצה), עם התווית מעל השדה.
 * הערך הסגור לפי formatSelection של הטופס - למשל שם מכשיר אחד, או "{n} מכשירים"
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
}: MultiSelectFieldProps) {
  const labelId = useId();

  const renderSelection = () => {
    const selectedLabels = selectedLabelsOf(options, value);
    if (selectedLabels.length === 0) return "";
    return formatSelection ? formatSelection(selectedLabels) : selectedLabels.join(DEFAULT_SELECTION_SEPARATOR);
  };

  return (
    <div className="min-w-0">
      {label && <FieldLabelText id={labelId} text={label} isRequired={required} />}
      <IpsSelect
        multiple
        labelId={label ? labelId : undefined}
        inputProps={ariaLabel ? { "aria-label": ariaLabel } : undefined}
        SelectDisplayProps={id ? { id } : undefined}
        options={options}
        // IpsSelect מקבל מערך מסוג אחד; הערכים בטופס מסוג אחד (למשל מזהי מכשירים)
        value={value as number[]}
        renderValue={renderSelection}
        error={error}
        helperText={helperText}
        onChange={(selectedValues) => onChange?.(Array.isArray(selectedValues) ? selectedValues : [])}
      />
    </div>
  );
}
