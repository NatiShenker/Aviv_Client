export const NUMBER_RESTRICTIONS_TEXTS = {
  title: "הגבלות והיתרים למספר",

  toolbar: {
    sectionTitle: "היסטוריית הגבלות והיתרים",
    searchLabel: "חיפוש הגבלות והיתרים",
    searchPlaceholder: "חיפוש חופשי",
    // מתחת לחיפוש. ברבים בזכר, כי ברשימה יש הגבלות והיתרים יחד; רשומה אחת - לפי הסוג שלה (הוחלט 2026-10-21)
    resultsCount: {
      single: { permit: "מוצג היתר אחד", restriction: "מוצגת הגבלה אחת" },
      several: (count: number) => `מוצגים ${count} הגבלות והיתרים`,
    },
  },

  // מיון הסטטוס בהיסטוריה. ברשימה יש הגבלות והיתרים יחד, ולכן בזכר (הוחלט 2026-10-21)
  statusSort: {
    activeFirst: "סטטוס: פעילים תחילה",
    endedFirst: "סטטוס: שהסתיימו תחילה",
  },

  /** סוג הרשומה המלא (ספק 04 overview §2.1): בבורר "הגבלה או היתר", בכרטיס הנעול ובחיפוש בהיסטוריה */
  recordTypes: {
    permit: "היתר למספר",
    restriction: "הגבלה למספר",
  },

  card: {
    typeTag: { permit: "היתר", restriction: "הגבלה" },
    activeBadge: { permit: "פעיל", restriction: "פעילה" },
    endedBadge: { permit: "הסתיים", restriction: "הסתיימה" },
    // הוחלט 2026-10-21
    createBasedOn: { permit: "יצירת היתר דומה", restriction: "יצירת הגבלה דומה" },
    /** בשורות ההגבלה שעליה יושב היתר (בבוחר ובכרטיס הנעול) */
    noReason: "ללא סיבה",
  },

  // היקף ההגבלה (ספק 04 overview §2.2)
  scopes: {
    national: "הגבלה ארצית",
    institute: (instituteNames: string) => `הגבלת פנימייה - ${instituteNames}`,
    trainee: "הגבלה לחניך",
    institutesSeparator: ", ",
  },

  values: {
    /** בין חלקים בשורה אחת, למשל "{היקף} · {טווח}" */
    partsSeparator: " · ",
  },

  details: {
    type: "סוג",
    onRestriction: "חל על הגבלה",
    hours: "שעות מותרות",
    devices: "מכשירים מותרים",
  },

  states: {
    // מוצעים - ממתינים לאישור (pending-decisions)
    loading: "טוען הגבלות והיתרים…",
    loadFailed: "לא ניתן לטעון את ההגבלות וההיתרים",
    noResults: "לא נמצאו הגבלות או היתרים",
  },

  newRecord: "הוספת הגבלה או היתר",

  form: {
    titles: {
      create: { permit: "היתר חדש", restriction: "הגבלה חדשה" },
      edit: { permit: "עריכת היתר", restriction: "עריכת הגבלה" },
    },
    save: "שמירה",
    // מוצע - ממתין לאישור (pending-decisions). בהגבלה כל מספר נשמר כהגבלה נפרדת
    savedToast: {
      permit: "ההיתר נשמר",
      restriction: (savedCount: number) => (savedCount > 1 ? "ההגבלות נשמרו" : "ההגבלה נשמרה"),
    },

    actionType: {
      title: "הגבלה או היתר",
      // מוצעים - ממתינים לאישור (pending-decisions)
      descriptions: {
        permit: "פתיחת מספר שחסום עבור החניך",
        restriction: "חסימת מספר אחד או יותר לחניך",
      },
      phoneHints: {
        permit: "הזן את המספר המלא, כדי לאתר את ההגבלות החלות עליו עבור החניך",
        restriction: "ניתן להזין מספר אחד או יותר. כל מספר יישמר כהגבלה נפרדת",
      },
    },

    noRestrictions: {
      text: "אין הגבלה פעילה על המספר, ולכן אין צורך בהיתר",
      restrictNumber: "הגבלת המספר",
    },

    picker: {
      chooseTitle: "בחירת ההגבלה שעליה יחול ההיתר",
      selectedTitle: "ההגבלה שעליה יחול ההיתר",
      singleResultHint: "זו ההגבלה היחידה על המספר, ולכן נבחרה",
      resultsCountHint: (count: number) => `נמצאו ${count} הגבלות על המספר`,
      change: "החלפה",
      // מוצעים - ממתינים לאישור (pending-decisions)
      cancelChange: "ביטול",
      choose: "בחירה",
      chooseLabel: (scopeLabel: string, dateRange: string) => `בחירה: ${scopeLabel}, ${dateRange}`,
      selectedTag: "נבחרה",
      existingPermits: (permitsSummary: string) => `היתרים קיימים לחניך: ${permitsSummary}`,
      existingPermitsSeparator: "; ",
    },

    lockedCard: {
      onRestriction: "חל על הגבלה",
    },

    detailsBlock: {
      title: { permit: "פרטי ההיתר", restriction: "פרטי ההגבלה" },
      // רק בהיתר: התאריכים שלו מוגבלים לתקופת ההגבלה. בהגבלה אין הסבר
      permitDateRangeDescription: "בתוך תקופת ההגבלה",
    },

    conditionsBlock: {
      title: "שעות ומכשירים",
    },

    validation: {
      searchRequired: "יש להזין מספר ולחפש",
      restrictedSearchRequired: "יש להזין מספר מוגבל ולחפש",
      restrictionRequired: "יש לבחור הגבלה",
      permitOutsideRestriction: (range: string) => `תאריכי ההיתר צריכים להיות בתוך תקופת ההגבלה: ${range}`,
      // מוצעים (ספק 04 form §6.3, §7) - ממתינים לאישור (pending-decisions)
      searchFailed: "החיפוש נכשל. ניתן לנסות שוב",
      restrictionNoLongerActive: "ההגבלה שנבחרה אינה פעילה עוד. יש לחפש שוב",
    },
  },
} as const;
