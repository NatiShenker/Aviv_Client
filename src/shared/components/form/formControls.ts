import type { ComponentType, InputHTMLAttributes, KeyboardEventHandler, ReactNode, RefAttributes } from "react";
import type { IpsSelectOption, UploadResult } from "ui-library";

/*
 * חוזה פקדי הטופס: הבלוקים המשותפים של הטפסים מקבלים את הפקדים מהפריסה (FormControlsProvider),
 * ולא בוחרים בעצמם בין פקדי מובייל לדסקטופ. רק ה-props שהבלוקים צריכים, והערכים כמחרוזות -
 * כל פריסה ממירה אותם לפקדים שלה במקום אחד.
 */

/** אפשרות בבורר. group = כותרת קבוצה (למשל אגף) */
export type FieldOption = IpsSelectOption;
export type FieldOptionValue = string | number;

interface FieldBaseProps {
  id?: string;
  /** תווית מעל השדה */
  label?: string;
  /** שם נגיש כשאין תווית גלויה, או כשהתווית לא מספיקה */
  "aria-label"?: string;
  /** מוסיף כוכבית לתווית */
  required?: boolean;
  error?: boolean;
  /** טקסט מתחת לשדה (למשל שגיאת טעינה) */
  helperText?: string;
}

export interface DateFieldProps extends FieldBaseProps {
  /** 'YYYY-MM-DD', או '' כשאין תאריך */
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** 'YYYY-MM-DD' */
  min?: string;
  /** 'YYYY-MM-DD' */
  max?: string;
  /** הטקסט שמוצג לתאריך */
  formatValue?: (value: string) => string;
  /** ערך ברירת מחדל שהמשתמש עוד לא שינה - מוצג באפור (ספק 00 §3.6) */
  muted?: boolean;
}

export interface TimeFieldProps extends FieldBaseProps {
  /** 'HH:mm', או '' כשאין שעה */
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** השם הנגיש של כפתור הניקוי. בלעדיו אין כפתור ניקוי */
  clearButtonLabel?: string;
}

export interface SelectFieldProps extends FieldBaseProps {
  options: FieldOption[];
  /** null = לא נבחר כלום */
  value: FieldOptionValue | null;
  /** הערך המקורי של האפשרות (מספר נשאר מספר) */
  onChange?: (value: FieldOptionValue) => void;
  placeholder?: string;
}

export interface MultiSelectFieldProps extends FieldBaseProps {
  options: FieldOption[];
  value: FieldOptionValue[];
  onChange?: (values: FieldOptionValue[]) => void;
  /** הטקסט של השדה כשנבחרו אפשרויות */
  formatSelection?: (selectedLabels: string[]) => string;
  /** הטקסט של השדה כשלא נבחר כלום */
  placeholder?: string;
}

export interface TextFieldProps extends FieldBaseProps {
  value: string;
  onChange?: (value: string) => void;
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  maxLength?: number;
  enterKeyHint?: InputHTMLAttributes<HTMLInputElement>["enterKeyHint"];
  placeholder?: string;
  "aria-describedby"?: string;
  /** יחידה שמוצגת אחרי הערך, למשל "דק׳" */
  suffix?: string;
  /** אייקון בקצה השדה (מוחלף בכפתור הניקוי כשיש ערך) */
  endIcon?: ReactNode;
  /** השם הנגיש של כפתור הניקוי. בלעדיו אין כפתור ניקוי */
  clearButtonLabel?: string;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
}

export interface TextAreaFieldProps extends FieldBaseProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export interface RadioFieldOption {
  value: FieldOptionValue;
  label: string;
  /** ההשלכה של הבחירה. כשיש לאפשרויות תיאור, הן מוערמות אחת מתחת לשנייה (ספק 00 §3.8) */
  description?: string;
}

export interface RadioGroupFieldProps {
  options: RadioFieldOption[];
  value: FieldOptionValue | null;
  onChange?: (value: FieldOptionValue) => void;
  /** כותרת גלויה, שהיא גם שם הקבוצה */
  label?: string;
  "aria-label"?: string;
}

/**
 * צירוף קובץ אחד, שמועלה ל-SharePoint. בשתי הפריסות אותו מנגנון העלאה של הספרייה;
 * במובייל ההעלאה מתחילה מיד כשנבחר קובץ, ובדסקטופ אחרי "שמור קבצים" של הפקד
 */
export interface FileUploadFieldProps {
  /** יעד ההעלאה: הסביבה ואתר ה-SharePoint */
  sviva: string;
  system: string;
  /** מוסיף כניסה למצלמה */
  camera?: boolean;
  /** מסגרת שגיאה (למשל כשחסר קובץ חובה) */
  error?: boolean;
  /** מובייל: הטקסט בשדה לפני בחירה, ליד שם הקובץ בזמן העלאה, והשם הנגיש של כפתור המצלמה */
  placeholder: string;
  uploadingText: string;
  cameraButtonLabel: string;
  /** דסקטופ: ההסבר על "שמור קבצים" של התהליך הדו-שלבי. במובייל ההעלאה מיידית, ואין בו צורך */
  saveFilesHint: string;
  onBeforeSave: () => Promise<boolean>;
  onSaveSuccess: (uploadedFiles: UploadResult[]) => void;
  onSaveError: (error: unknown) => void;
}

/** הפקדים של פריסה אחת. אובייקט קבוע לכל פריסה */
export interface FormControls {
  DateField: ComponentType<DateFieldProps>;
  TimeField: ComponentType<TimeFieldProps>;
  SelectField: ComponentType<SelectFieldProps>;
  MultiSelectField: ComponentType<MultiSelectFieldProps>;
  /** עם ref, כדי שאפשר יהיה להעביר פוקוס לשדה (למשל משך השיחה כשהוא מופיע) */
  TextField: ComponentType<TextFieldProps & RefAttributes<HTMLInputElement>>;
  TextAreaField: ComponentType<TextAreaFieldProps>;
  RadioGroupField: ComponentType<RadioGroupFieldProps>;
  FileUploadField: ComponentType<FileUploadFieldProps>;
}
