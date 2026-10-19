/*
 * "בורר הקשר" בשורת כותרת (למשל הפנימייה, או הפעולה במגירה): טקסט וחץ, בלי מסגרת, כמו במובייל (design.md).
 * ל-IpsSelect אין מראה כזה, ולכן ההתאמה נעשית במקום השימוש דרך sx, והפקד בספרייה לא משתנה.
 * הגופן והצבע נורשים מהעוטף
 */
export const CONTEXT_SELECT_SX = {
  color: "inherit",
  font: "inherit",
  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
  "& .MuiSelect-icon": { color: "inherit" },
} as const;
