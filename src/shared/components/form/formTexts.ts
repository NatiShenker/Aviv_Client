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
  },

  dateRange: {
    title: "טווח תאריכים",
    startDate: "תאריך התחלה",
    endDate: "תאריך סיום",
    placeholder: "--/--/--",
  },

  // "שעות מותרות" ו"מכשירים מותרים" (ספק 00 §3.10, ספק 03 form §3.3)
  conditions: {
    hoursTitle: "שעות מותרות",
    hoursHint: "השיחות יותרו רק בשעות אלו, בכל יום בטווח התאריכים",
    startTime: "שעת התחלה",
    endTime: "שעת סיום",
    timePlaceholder: "--:--",
    clearStartTime: "ניקוי שעת התחלה",
    clearEndTime: "ניקוי שעת סיום",
    devicesTitle: "מכשירים מותרים",
    devicesHint: "השיחות יותרו רק מהמכשירים שנבחרו",
    pickDevice: "בחר מכשיר",
    // מוצע - ממתין לאישור (pending-decisions)
    devicesLoadFailed: "לא ניתן לטעון את המכשירים",
    retry: "נסה שוב",
  },

  // שדה הטלפון (ספק 00 §3.15)
  phone: {
    inputLabel: "מספר טלפון",
    placeholder: "הקלד",
    add: "הוסף",
    search: "חיפוש",
    addedNumbers: "מספרים שנוספו",
    removeNumber: (phone: string) => `הסרת המספר ${phone}`,
    invalid: "מספר טלפון לא תקין",
    duplicate: "המספר כבר נוסף",
    required: "יש להוסיף לפחות מספר אחד",
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
    // מוצעים - הפירוט והגורם המאשר חובה בכל הטפסים, והסיבה בהגבלת חניך (ספק 00 §4.3)
    reasonRequired: "יש לבחור סיבה",
    detailsRequired: "יש להזין פירוט",
    approverRequired: "יש לבחור גורם מאשר",
    fileRequired: "יש לצרף קובץ",
    // מוצע (ספק 03 form §7)
    fileUploadFailed: "העלאת הקובץ נכשלה, נסה שוב",
  },

  footer: {
    cancel: "ביטול",
  },

  // מוצע (ספק 03 form §7)
  saveFailed: "השמירה נכשלה. נסה שוב",
} as const;
