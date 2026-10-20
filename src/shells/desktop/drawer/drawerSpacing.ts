/*
 * הריווח בצדי מגירה בדסקטופ. כמו במובייל, הוא שייך למכולה (כותרת, מסך, פוטר) ולא לרכיבי התוכן.
 * פס גלילה רגיל (למשל בחלונות) תופס רוחב רק מהאזור שנגלל, ולכן גם שורה שלא נגללת שומרת לו מקום -
 * וכך כל השורות במגירה נגמרות באותו קו. scrollbar-gutter פועל רק כש-overflow אינו visible, ומכאן ה-overflow-hidden.
 * בפס שמרחף מעל התוכן (מק) המקום השמור הוא 0. מחלקות מלאות, כדי ש-Tailwind ימצא אותן בסריקה
 */

/** שורה קבועה במגירה: כותרת, שורה עליונה, סרגל, פוטר */
export const DRAWER_ROW_GUTTER_CLASS = "px-8 overflow-hidden scrollbar-gutter-stable";

/** אזור שנגלל במגירה: רשימה, גוף טופס */
export const DRAWER_SCROLL_AREA_CLASS = "px-8 overflow-y-auto scrollbar-gutter-stable";
