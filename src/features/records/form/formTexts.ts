/** טקסטים משותפים לטופסי היצירה והעריכה (ספק 00 §3, §4.3) */
export const FORM_TEXTS = {
  limitType: {
    // ספק 00 §3.9 - הגדרה להגבלה ולהיתר
    restriction: {
      title: "סוג ההגבלה",
      full: { label: "הגבלה מלאה", hint: "השיחות חסומות, למעט השעות והמכשירים שיוגדרו למטה" },
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
    placeholder: "מספר דקות",
    // גרש עברי (׳), לא גרש מהמקלדת
    unit: "דק׳",
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
    hoursHint: "בכל יום בטווח התאריכים",
    startTime: "שעת התחלה",
    endTime: "שעת סיום",
    timePlaceholder: "--:--",
    clearStartTime: "ניקוי שעת התחלה",
    clearEndTime: "ניקוי שעת סיום",
    devicesTitle: "מכשירים מותרים",
    pickDevice: "מכשירים",
    // מוצע - ממתין לאישור (pending-decisions)
    devicesLoadFailed: "לא ניתן לטעון את המכשירים",
    retry: "טעינה מחדש",
  },

  // שדה הטלפון (ספק 00 §3.15)
  phone: {
    inputLabel: "מספר טלפון",
    placeholder: "מספר טלפון",
    add: "הוספה",
    search: "חיפוש",
    addedNumbers: "מספרים שנוספו",
    removeNumber: (phone: string) => `הסרת המספר ${phone}`,
    invalid: "מספר טלפון לא תקין",
    duplicate: "המספר כבר נוסף",
    required: "יש להוסיף לפחות מספר אחד",
  },

  decision: {
    title: "סיבות ואישורים",
    reasonLabel: "סיבה",
    reasonPlaceholder: "בחירת סיבה",
    reasonsLoadFailed: "לא ניתן לטעון את רשימת הסיבות",
    detailsLabel: "פירוט",
    detailsPlaceholder: "הוספת פירוט",
    approverLabel: "גורם מאשר",
    changeApprover: "החלפה",
    cancelApproverChange: "ביטול",
    fileLabel: "צירוף קובץ",
    // מובייל: השדה של IpsFileUploadMobile. מוצעים - ממתינים לאישור (pending-decisions)
    filePlaceholder: "בחירת קובץ",
    fileUploading: "מעלה…",
    fileCamera: "מצלמה",
    // דסקטופ בלבד - IpsFileUpload מעלה רק אחרי לחיצה על הכפתור שלו (ראו pending-decisions). לשון סתמית ומירכאות
    // עבריות (הוחלט 2026-10-21)
    fileHint: "יש לבחור קובץ וללחוץ על ״שמור קבצים״ כדי לצרף אותו",
    removeFile: "הסרת הקובץ",
    retry: "טעינה מחדש",
  },

  validation: {
    // מוצעים - הפירוט והגורם המאשר חובה בכל הטפסים, והסיבה בהגבלת חניך (ספק 00 §4.3)
    reasonRequired: "יש לבחור סיבה",
    detailsRequired: "יש להזין פירוט",
    approverRequired: "יש לבחור גורם מאשר",
    fileRequired: "יש לצרף קובץ",
    // מוצע (ספק 03 form §7)
    fileUploadFailed: "העלאת הקובץ נכשלה. ניתן לנסות שוב",
  },

  footer: {
    cancel: "ביטול",
  },

  // מוצע (ספק 03 form §7)
  saveFailed: "השמירה נכשלה. ניתן לנסות שוב",
} as const;
