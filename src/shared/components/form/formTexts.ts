// רווח קשיח: היחידה לא נשברת לשורה נפרדת מהמספר
const NO_BREAK_SPACE = " ";

/** טקסטים משותפים לטופסי היצירה והעריכה (ספק 00 §3, §4.3) */
export const FORM_TEXTS = {
  limitType: {
    // ספק 00 §3.9 - הגדרה להגבלה ולהיתר
    restriction: {
      title: "סוג ההגבלה",
      full: { label: "הגבלה מלאה", hint: "השיחות חסומות, למעט ההיתרים שיוגדרו למטה" },
      limited: { label: "הגבלת משך שיחה", hint: "השיחות מותרות, עד משך מרבי לכל שיחה" },
    },
    permit: {
      title: "סוג ההיתר",
      full: { label: "היתר מלא", hint: "השיחות מותרות ללא הגבלת משך" },
      limited: { label: "היתר עם הגבלת משך", hint: "השיחות מותרות, עד משך מרבי לכל שיחה" },
    },
  },

  duration: {
    label: "משך מרבי לכל שיחה",
    placeholder: "הזן דקות",
    unit: "דק'",
    clear: "ניקוי משך השיחה",
    /** "עד X דק'" בתקצירים */
    upTo: (minutes: number) => `עד${NO_BREAK_SPACE}${minutes}${NO_BREAK_SPACE}דק'`,
  },

  decision: {
    title: "סיבות והחלטה",
    reasonLabel: "סיבה/הערה",
    reasonPlaceholder: "בחר סיבה",
    reasonsLoadFailed: "לא ניתן לטעון את רשימת הסיבות",
    detailsLabel: "פירוט",
    detailsPlaceholder: "הוסף פירוט",
    approverLabel: "גורם מאשר",
    changeApprover: "החלפה",
    cancelApproverChange: "ביטול",
    fileLabel: "צירוף קובץ",
    // מוצע - IpsFileUpload מעלה רק אחרי לחיצה על הכפתור שלו (ראו pending-decisions)
    fileHint: "בחר קובץ ולחץ 'שמור קבצים' כדי לצרף אותו",
    removeFile: "הסרת הקובץ",
    retry: "נסה שוב",
  },

  validation: {
    // מוצעים - הסיבה והגורם המאשר חובה (ספק 00 §4.3)
    reasonRequired: "יש לבחור סיבה",
    approverRequired: "יש לבחור גורם מאשר",
    fileRequired: "יש לצרף קובץ",
    // מוצע (ספק 03 form §7)
    fileUploadFailed: "העלאת הקובץ נכשלה, נסה שוב",
  },

  // מוצע (ספק 03 form §7)
  saveFailed: "השמירה נכשלה. נסה שוב",
} as const;
