/** מזהה הקליינט של אביב. נשלח בכל פנייה לסרביס שמקבלת clientIds */
export const AVIV_CLIENT_ID = 55;

/** מספר הפריטים שמתווספים בכל שלב של טעינה הדרגתית ברשימות */
export const LIST_PAGE_SIZE = 30;

/** תוקף הבחירות שנשמרות בזכרון המקומי (פנימייה, אגף), נספר מהבחירה האחרונה */
export const SELECTION_TTL_DAYS = 30;

/** כל מפתחות הזכרון המקומי של האפליקציה במקום אחד, כדי למנוע התנגשויות */
export const STORAGE_KEYS = {
  selectedInstitute: "aviv.selectedInstitute",
  traineesWingFilter: "aviv.trainees.wingFilter",
} as const;

/** לוקאל להשוואת מחרוזות בעברית (מיון לפי שם, אגף ומיקום) */
export const HEBREW_LOCALE = "he";

/** מרוחב המכולה הזה ומעלה מוצגת פריסת הדסקטופ. אין פריסת טאבלט - טאבלט צר יותר מקבל את פריסת המובייל */
export const DESKTOP_LAYOUT_MIN_WIDTH_PX = 1024;

/**
 * יעד ההעלאה של קבצי האסמכתא ב-SharePoint (IpsFileUpload). שני הערכים זמניים:
 * שם האתר והסביבה עוד לא הוגדרו (ראו pending-decisions)
 */
export const SHAREPOINT_UPLOAD_TARGET = {
  environment: "dev",
  site: "aviv",
} as const;
