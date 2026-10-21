import { useId } from "react";
import { IpsTextArea } from "ui-library";
import FieldLabelText from "@/shared/components/form/FieldLabelText";
import type { TextAreaFieldProps } from "@/shared/components/form/formControls";

// שלוש שורות בגובה קבוע, כמו במובייל (ספק 00 §3.14): טקסט ארוך יותר נגלל בתוך השדה
const TEXT_AREA_ROWS = 3;

// לשדה רב-שורות של MUI יש ריווח משלו, ועליו ערכת הנושא מוסיפה את הריווח של שדה רגיל - הטקסט יצא מוזח פעמיים.
// IpsTextArea מתעלם מ-sx, ולכן הריווח הכפול מוסר דרך style של ה-textarea, במקום השימוש
const TEXT_AREA_INPUT_STYLE = { padding: 0 } as const;

// בגודל הרגיל הריווח העליון של שדה רב-שורות ב-MUI הוא 16.5, והטקסט יושב נמוך מבשאר השדות (8).
// בגודל small הוא 8.5 - כמו שאר השדות. הצד נשאר 14, והגופן לא משתנה
const TEXT_AREA_SIZE = "small";

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
        size={TEXT_AREA_SIZE}
        rows={TEXT_AREA_ROWS}
        maxRows={TEXT_AREA_ROWS}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        error={error}
        helperText={helperText}
        inputProps={{
          style: TEXT_AREA_INPUT_STYLE,
          "aria-label": ariaLabel,
          "aria-labelledby": label && !ariaLabel ? labelId : undefined,
          "aria-required": required,
        }}
      />
    </div>
  );
}
