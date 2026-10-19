import { useEffect, useState } from "react";

interface PickerDraftOptions<TPickerValue> {
  /** הערך בטופס (מחרוזת) */
  value: string;
  toPickerValue: (value: string) => TPickerValue | null;
  fromPickerValue: (pickerValue: TPickerValue | null) => string;
  onChange?: (value: string) => void;
}

/**
 * פקד תאריך או שעה של MUI מחזיר ערך לא תקין בזמן הקלדה חלקית, ומצפה לקבל אותו בחזרה.
 * הערך של הפקד נשמר כאן, כדי שההקלדה לא תתאפס, והטופס מקבל ערך שלם - או '' כשהשדה ריק או חלקי,
 * כך שהבדיקה בשמירה תראה שחסר ערך
 */
export function usePickerDraft<TPickerValue>({
  value,
  toPickerValue,
  fromPickerValue,
  onChange,
}: PickerDraftOptions<TPickerValue>) {
  const [draft, setDraft] = useState<TPickerValue | null>(() => toPickerValue(value));

  // הערך בטופס השתנה מבחוץ (למשל תאריכים שנקבעים לפי ההגבלה שנבחרה) - הפקד מתעדכן אליו
  useEffect(() => {
    if (fromPickerValue(draft) !== value) {
      setDraft(toPickerValue(value));
    }
    // רק שינוי בערך שבטופס; כל הקלדה כבר עדכנה את שניהם
  }, [value]);

  const changeDraft = (nextDraft: TPickerValue | null) => {
    setDraft(nextDraft);
    onChange?.(fromPickerValue(nextDraft));
  };

  return { draft, changeDraft };
}
