// אזור נגיעה מינימלי לאצבע (design.md › User Experience: לפחות 44×44)
const MIN_TOUCH_TARGET_PX = 44;

// כמה השכבה חורגת מכל צד: חצי מההפרש עד 44. בכפתור שכבר גדול מ-44 - אפס (לא מקטינים)
const TOUCH_OVERHANG = `min(0px, calc((100% - ${MIN_TOUCH_TARGET_PX}px) / 2))`;

/**
 * sx לכפתור קטן מהספרייה: מגדיל את אזור הנגיעה ל-44 בלי לשנות את המראה או את הפריסה.
 * שכבה שקופה (::after) שחורגת מהכפתור באופן שווה מכל צד; כפתורי MUI כבר ממוקמים relative.
 * החריגה סימטרית, ולכן לא מושפעת מהיפוך ה-RTL של הספרייה
 */
export const EXPANDED_TOUCH_TARGET_SX = {
  "&::after": {
    content: '""',
    position: "absolute",
    inset: TOUCH_OVERHANG,
  },
} as const;
