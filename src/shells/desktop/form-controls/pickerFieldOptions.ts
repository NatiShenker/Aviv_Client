import { heIL } from "@mui/x-date-pickers/locales";

/** תאריך כמו בכל האפליקציה: DD/MM/YY (ספק 00 §5) */
export const DATE_DISPLAY_FORMAT = "dd/MM/yy";

/** שעה ב-24 שעות: HH:mm (ספק 00 §5) */
export const TIME_DISPLAY_FORMAT = "HH:mm";

// הקטעים הריקים של השדה מוצגים כ"--", כמו "--/--/--" ו-"--:--" במובייל (ספק 00 §3.6)
const EMPTY_SECTION_PLACEHOLDER = "--";

// הטקסטים העבריים של MUI לפקדי התאריך והשעה (למשל "בחירת תאריך", "החודש הקודם"): בלעדיהם קורא מסך מקריא
// את הכפתורים ואת לוח השנה באנגלית
const HEBREW_PICKER_TEXTS = heIL.components.MuiLocalizationProvider.defaultProps.localeText;

export const DATE_FIELD_LOCALE_TEXT = {
  ...HEBREW_PICKER_TEXTS,
  fieldDayPlaceholder: () => EMPTY_SECTION_PLACEHOLDER,
  fieldMonthPlaceholder: () => EMPTY_SECTION_PLACEHOLDER,
  fieldYearPlaceholder: () => EMPTY_SECTION_PLACEHOLDER,
};

export const TIME_FIELD_LOCALE_TEXT = {
  ...HEBREW_PICKER_TEXTS,
  fieldHoursPlaceholder: () => EMPTY_SECTION_PLACEHOLDER,
  fieldMinutesPlaceholder: () => EMPTY_SECTION_PLACEHOLDER,
};

/** ערך ברירת מחדל שהמשתמש עוד לא שינה מוצג באפור (ספק 00 §3.6). ההתאמה במקום השימוש - הפקד לא משתנה */
export const MUTED_VALUE_SX = {
  "& .MuiInputBase-input": { color: "var(--color-text-muted)" },
} as const;

/**
 * בורר בלי בחירה: הטקסט שבו ("בחירת סיבה", "כל המכשירים") באפור, כמו במובייל (ספק 00 §3.11),
 * כדי שלא ייקרא כערך שנבחר. ההתאמה במקום השימוש - הפקד לא משתנה
 */
export const PLACEHOLDER_VALUE_SX = {
  "& .MuiSelect-select": { color: "var(--color-text-muted)" },
} as const;
