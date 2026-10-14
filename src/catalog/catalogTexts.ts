export const CATALOG_TEXTS = {
  pageTitle: "קטלוג פקדים",
  pageDescription: "דף בדיקה לתשתית: פקדי ספריית הפקדים וטוקני העיצוב, בפריסת מובייל.",

  sectionTitles: {
    actions: "כפתורים",
    text: "שדות טקסט",
    selection: "בחירה",
    dateTime: "תאריך ושעה",
    overlays: "חלוניות והודעות",
    tokens: "טוקני צבע",
  },

  actions: {
    newRecord: "רשומה חדשה",
    save: "שמור",
    cancel: "ביטול",
    edit: "עריכה",
    back: "חזרה",
    search: "חיפוש",
    close: "סגירה",
  },

  text: {
    showErrors: "הצגת מצב שגיאה",
    searchPlaceholder: "חיפוש לפי שם או מספר",
    phoneLabel: "מספר טלפון",
    phonePlaceholder: "הקלד",
    detailsLabel: "פירוט",
    detailsPlaceholder: "הוסף פירוט",
    requiredError: "שדה חובה",
  },

  selection: {
    reasonLabel: "סיבה/הערה",
    reasonPlaceholder: "בחר סיבה",
    devicesLabel: "מכשירים",
    devicesPlaceholder: "כל המכשירים",
    approverLabel: "גורם מאשר",
    statusLabel: "סטטוס",
    repeatLabel: "חזרה במהלך השיחה",
    attachmentConfirmLabel: "צורף מסמך החלטה",
  },

  dateTime: {
    startDate: "תאריך התחלה",
    endDate: "תאריך סיום",
    startTime: "שעת התחלה",
    endTime: "שעת סיום",
  },

  overlays: {
    openSheet: "פתיחת מיון",
    sheetTitle: "מיון",
    openDialog: "פתיחת דיאלוג",
    dialogTitle: "לצאת בלי לשמור?",
    dialogBody: "השינויים שלא נשמרו יאבדו.",
    stay: "המשך עריכה",
    leave: "יציאה",
    toastLabels: {
      success: "הצלחה",
      info: "מידע",
      warning: "אזהרה",
      danger: "שגיאה",
    },
    toastMessages: {
      success: "הפעולה בוצעה בהצלחה",
      info: "מידע לידיעתך",
      warning: "שים לב לפרט חסר",
      danger: "הפעולה נכשלה, נסה שוב",
    },
    accordionSummary: "01/06/25-05/06/25 · הפרת משמעת",
  },
} as const;
