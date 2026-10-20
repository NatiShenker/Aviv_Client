/** טקסטים משותפים למסכי ההיסטוריה (ספק 00 §3.18, §3.22, §3.23, §4.1) */
export const HISTORY_TEXTS = {
  toolbar: {
    clearSearch: "ניקוי חיפוש",
    sort: "מיון",
    // דסקטופ: בורר המיון מציג רק "מיון", ולכן השם הנגיש כולל את המיון הנוכחי. מוצע - ממתין לאישור (pending-decisions)
    sortWithCurrent: (currentSortLabel: string) => `מיון: ${currentSortLabel}`,
  },
  // תגיות הסטטוס בקבצי הטקסטים של כל פעולה, כי הן במין של הרשומה ("הסתיימה" / "הסתיים")
  card: {
    edit: "עריכה",
  },
  // "למה ומי" בכרטיס פתוח, זהים בכל ההיסטוריות (ספק 00 §3.22)
  details: {
    reason: "סיבה",
    approver: "גורם מאשר",
    details: "פירוט",
    notSpecified: "לא צוין",
  },
  // תוויות המיון מוצעות - ממתינות לאישור (pending-decisions)
  sort: {
    startDateDescending: "תאריך התחלה: מהחדש לישן",
    startDateAscending: "תאריך התחלה: מהישן לחדש",
    endDateDescending: "תאריך סיום: מהחדש לישן",
    endDateAscending: "תאריך סיום: מהישן לחדש",
    statusActiveFirst: "סטטוס: פעילות קודם",
    statusEndedFirst: "סטטוס: שהסתיימו קודם",
  },
  states: {
    retry: "נסה שוב",
  },
} as const;
