export const NUMBER_RESTRICTIONS_TEXTS = {
  title: "הגבלה/היתר למספר",

  toolbar: {
    sectionTitle: "הסטוריית הגבלות והיתרים",
    searchLabel: "חיפוש הגבלות והיתרים",
    searchPlaceholder: "חיפוש לפי מספר, סיבה או תאריך",
  },

  /** סוג הרשומה המלא (ספק 04 overview §2.1) */
  recordTypes: {
    permit: "היתר למספר מוגבל",
    restriction: "הגבלת מספר",
  },

  card: {
    typeTag: { permit: "היתר", restriction: "הגבלה" },
    activeBadge: { permit: "פעיל", restriction: "פעילה" },
    noReason: "ללא סיבה",
  },

  // היקף ההגבלה (ספק 04 overview §2.2)
  scopes: {
    national: "הגבלה ארצית",
    institute: (instituteNames: string) => `הגבלת פנימייה – ${instituteNames}`,
    trainee: "הגבלה לחניך",
    institutesSeparator: ", ",
  },

  values: {
    /** בין חלקים בשורה אחת, למשל "{היקף} · {טווח}" */
    partsSeparator: " · ",
  },

  details: {
    type: "סוג",
    dates: "תאריכים",
    onRestriction: "על הגבלה",
    hours: "שעות מותרות",
    devices: "מכשירים מותרים",
    reason: "סיבה",
    approver: "גורם מאשר",
    details: "פירוט",
    notSpecified: "לא צוין",
  },

  states: {
    // מוצעים - ממתינים לאישור (pending-decisions)
    loading: "טוען הגבלות והיתרים…",
    loadFailed: "לא ניתן לטעון את ההגבלות וההיתרים",
    noResults: "לא נמצאו הגבלות או היתרים",
  },

  newRecord: "הוספת הגבלה/היתר",

  form: {
    titles: {
      create: { permit: "היתר חדש", restriction: "הגבלה חדשה" },
      edit: { permit: "עריכת היתר", restriction: "עריכת הגבלה" },
    },
    save: "שמור",

    actionType: {
      title: "סוג הפעולה",
      phoneHints: {
        permit: "הזן את המספר המלא כדי לאתר את ההגבלות החלות עליו עבור החניך",
        restriction: "הזן מספר אחד או יותר. כל מספר יישמר כהגבלה נפרדת",
      },
    },

    noRestrictions: {
      text: "לא נמצאו הגבלות פעילות על המספר עבור החניך – המספר פתוח ואין צורך בהיתר",
      restrictNumber: "להגבלת המספר",
    },

    picker: {
      chooseTitle: "בחר את ההגבלה שעליה יחול ההיתר",
      selectedTitle: "ההגבלה שעליה יחול ההיתר",
      singleResultHint: "זו ההגבלה היחידה החלה על המספר עבור החניך, ולכן נבחרה",
      resultsCountHint: (count: number) => `נמצאו ${count} הגבלות החלות על המספר עבור החניך`,
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
      onRestriction: "על הגבלה",
    },

    detailsBlock: {
      title: { permit: "פרטי ההיתר", restriction: "פרטי ההגבלה" },
      dateRangeDescription: {
        permit: "ההיתר יחול בתאריכים אלו, בתוך תקופת ההגבלה",
        restriction: "ההגבלה תחול בתאריכים אלו בלבד",
      },
    },

    conditionsBlock: {
      title: { permit: "הגבלה להיתר", restriction: "היתרים להגבלה" },
      permitHint: "ברירת מחדל – פתוח כל היום ובכל המכשירים",
      restrictionHint: {
        full: "ללא היתרים – חסום לחלוטין. הגדר שעות או מכשירים שבהם מותר לשוחח",
        limited: "ללא הגדרה – מותר כל היום ובכל המכשירים, בהגבלת המשך שנבחרה",
      },
    },

    validation: {
      searchRequired: "יש להזין מספר ולחפש",
      restrictedSearchRequired: "יש להזין מספר מוגבל ולחפש",
      restrictionRequired: "יש לבחור הגבלה",
      permitOutsideRestriction: (range: string) => `תאריכי ההיתר חייבים להיות בתוך תקופת ההגבלה (${range})`,
      // מוצעים (ספק 04 form §6.3, §7) - ממתינים לאישור (pending-decisions)
      searchFailed: "החיפוש נכשל, נסה שוב",
      restrictionNoLongerActive: "ההגבלה שנבחרה אינה פעילה עוד. יש לחפש שוב",
    },
  },
} as const;
