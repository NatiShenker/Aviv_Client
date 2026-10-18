export const TRAINEE_RESTRICTIONS_TEXTS = {
  title: "הגבלה/היתר לחניך",

  toolbar: {
    sectionTitle: "היסטוריית הגבלות",
    searchLabel: "חיפוש הגבלות",
    searchPlaceholder: "חיפוש לפי סיבה, גורם או תאריך",
  },

  card: {
    activeBadge: "פעילה",
    // מוצע - ממתין לאישור (pending-decisions)
    createBasedOn: "צור הגבלה חדשה על בסיס זו",
  },

  details: {
    hours: "שעות מותרות",
    devices: "מכשירים מותרים",
    reason: "סיבה",
    approver: "גורם מאשר",
    details: "פירוט",
    notSpecified: "לא צוין",
  },

  states: {
    loading: "טוען הגבלות…",
    // מוצע - ממתין לאישור (pending-decisions)
    loadFailed: "לא ניתן לטעון את ההגבלות",
    noResults: "לא נמצאו הגבלות",
  },

  newRestriction: "הוספת הגבלה",

  form: {
    createTitle: "הגבלה חדשה",
    editTitle: "עריכת הגבלה",
    save: "שמור",

    detailsBlock: {
      title: "פרטי ההגבלה",
      dateRangeDescription: "ההגבלה תחול בתאריכים אלו בלבד",
    },

    permitsBlock: {
      title: "היתרים להגבלה",
      hint: {
        full: "ללא היתרים – חסום לחלוטין. הגדר שעות או מכשירים שבהם מותר לשוחח",
        limited: "ללא הגדרה – מותר כל היום ובכל המכשירים, בהגבלת המשך שנבחרה",
      },
    },
  },
} as const;
