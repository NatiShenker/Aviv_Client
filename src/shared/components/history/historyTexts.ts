/** טקסטים משותפים למסכי ההיסטוריה (ספק 00 §3.18, §3.22, §3.23, §4.1) */
export const HISTORY_TEXTS = {
  toolbar: {
    clearSearch: "ניקוי חיפוש",
    sort: "מיון",
  },
  card: {
    edit: "עריכה",
    endedBadge: "הסתיים",
  },
  drawers: {
    close: "סגירה",
  },
  // תוויות המיון מוצעות - ממתינות לאישור (pending-decisions)
  sort: {
    startDateDescending: "תאריך התחלה – מהחדש לישן",
    startDateAscending: "תאריך התחלה – מהישן לחדש",
    endDateDescending: "תאריך סיום – מהחדש לישן",
    endDateAscending: "תאריך סיום – מהישן לחדש",
    statusActiveFirst: "סטטוס – פעילות קודם",
    statusEndedFirst: "סטטוס – שהסתיימו קודם",
  },
  states: {
    retry: "נסה שוב",
  },
} as const;
