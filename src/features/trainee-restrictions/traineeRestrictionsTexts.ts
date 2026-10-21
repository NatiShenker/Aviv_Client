export const TRAINEE_RESTRICTIONS_TEXTS = {
  title: "הגבלות לחניך",

  toolbar: {
    sectionTitle: "היסטוריית הגבלות",
    searchLabel: "חיפוש הגבלות",
    searchPlaceholder: "חיפוש חופשי",
    // מתחת לחיפוש, במין של הרשומה (הוחלט 2026-10-21)
    resultsCount: (count: number) => (count === 1 ? "מוצגת הגבלה אחת" : `מוצגות ${count} הגבלות`),
  },

  // מיון הסטטוס בהיסטוריה, במין של הרשומה (הוחלט 2026-10-21)
  statusSort: {
    activeFirst: "סטטוס: פעילות תחילה",
    endedFirst: "סטטוס: שהסתיימו תחילה",
  },

  card: {
    activeBadge: "פעילה",
    endedBadge: "הסתיימה",
    // הוחלט 2026-10-21
    createBasedOn: "יצירת הגבלה דומה",
  },

  details: {
    hours: "שעות מותרות",
    devices: "מכשירים מותרים",
  },

  states: {
    loading: "טוען הגבלות…",
    // מוצע - ממתין לאישור (pending-decisions)
    loadFailed: "לא ניתן לטעון את ההגבלות",
    noResults: "לא נמצאו הגבלות",
  },

  newRecord: "הוספת הגבלה",

  form: {
    createTitle: "הגבלה חדשה",
    editTitle: "עריכת הגבלה",
    save: "שמירה",
    // מוצע - ממתין לאישור (pending-decisions)
    savedToast: "ההגבלה נשמרה",

    detailsBlock: {
      title: "פרטי ההגבלה",
    },

    conditionsBlock: {
      title: "שעות ומכשירים",
    },
  },
} as const;
