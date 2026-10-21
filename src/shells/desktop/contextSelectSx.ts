/*
 * "בורר הקשר" בשורת כותרת (למשל הפנימייה, או הפעולה במגירה): טקסט וחץ, בלי מסגרת ובלי רקע, כמו במובייל (design.md).
 * ל-IpsSelect אין מראה כזה, ולכן ההתאמה נעשית במקום השימוש דרך sx, והפקד בספרייה לא משתנה.
 * - הגופן והצבע נורשים מהעוטף;
 * - בלי הרקע הלבן של שדה, ובלי הריווח בתחילת הטקסט - כדי שהטקסט יתיישר לשאר השורה ולא יזוז כשהבורר מחליף כותרת רגילה;
 * - בלי מסגרת אין סימן פוקוס של שדה, ולכן טבעת פוקוס במקלדת, כמו בשאר המשטחים של האפליקציה (FOCUS_RING_CLASS)
 */
export const CONTEXT_SELECT_SX = {
  color: "inherit",
  font: "inherit",
  backgroundColor: "transparent",
  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
  "& .MuiSelect-select": { paddingInlineStart: 0 },
  "& .MuiSelect-select:focus-visible": {
    outline: "2px solid var(--color-primary)",
    outlineOffset: "2px",
  },
  "& .MuiSelect-icon": { color: "inherit" },
} as const;

/** בורר הקשר שעוד לא נבחר בו ערך: הטקסט שבו ("בחירת פנימייה") באפור, כמו במובייל. החץ נשאר בצבע הטקסט */
export const EMPTY_CONTEXT_SELECT_SX = {
  ...CONTEXT_SELECT_SX,
  "& .MuiSelect-select": { ...CONTEXT_SELECT_SX["& .MuiSelect-select"], color: "var(--color-text-muted)" },
} as const;
