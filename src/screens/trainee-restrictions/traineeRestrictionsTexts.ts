// רווח קשיח, כדי ש"עד X דק'" לא יישבר בין שורות (ספק 03 overview §3.1)
const NO_BREAK_SPACE = " ";

export const TRAINEE_RESTRICTIONS_TEXTS = {
  title: "הגבלה/היתר לחניך",

  toolbar: {
    sectionTitle: "היסטוריית הגבלות",
    searchLabel: "חיפוש הגבלות",
    searchPlaceholder: "חיפוש לפי סיבה, גורם או תאריך",
  },

  card: {
    activeBadge: "פעילה",
    noReason: "ללא סיבה",
  },

  details: {
    dates: "תאריכים",
    type: "סוג ההגבלה",
    hours: "שעות מותרות",
    devices: "מכשירים מותרים",
    reason: "סיבה",
    approver: "גורם מאשר",
    details: "פירוט",
    notSpecified: "לא צוין",
  },

  values: {
    fullRestriction: "הגבלה מלאה",
    durationRestriction: (minutes: number) =>
      `הגבלת משך שיחה – עד${NO_BREAK_SPACE}${minutes}${NO_BREAK_SPACE}דק'`,
    allDay: "כל היום",
    allDevices: "כל המכשירים",
    notSet: "לא הוגדרו",
    devicesSeparator: ", ",
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
    loading: "טוען הגבלות…",
    // מוצע - ממתין לאישור (pending-decisions)
    loadFailed: "לא ניתן לטעון את ההגבלות",
    retry: "נסה שוב",
    noResults: "לא נמצאו הגבלות",
  },

  newRestriction: "הגבלה חדשה",

  form: {
    createTitle: "הגבלה חדשה",
    editTitle: "עריכת הגבלה",
    save: "שמור הגבלה",

    detailsBlock: {
      title: "פרטי ההגבלה",
      dateRangeTitle: "טווח תאריכים",
      dateRangeDescription: "ההגבלה תחול בתאריכים אלו בלבד",
      startDate: "תאריך התחלה",
      endDate: "תאריך סיום",
      datePlaceholder: "--/--/--",
    },

    permitsBlock: {
      title: "היתרים להגבלה",
      hint: {
        full: "ללא היתרים – חסום לחלוטין. הגדר שעות או מכשירים שבהם מותר לשוחח",
        limited: "ללא הגדרה – מותר כל היום ובכל המכשירים, בהגבלת המשך שנבחרה",
      },
      hoursTitle: "שעות מותרות",
      hoursHint: "השיחות יותרו רק בשעות אלו, בכל יום בטווח התאריכים",
      pickTime: "בחר שעה",
      startTime: "שעת התחלה",
      endTime: "שעת סיום",
      timePlaceholder: "--:--",
      clearStartTime: "ניקוי שעת התחלה",
      clearEndTime: "ניקוי שעת סיום",
      devicesTitle: "מכשירים מותרים",
      devicesHint: "השיחות יותרו רק מהמכשירים שנבחרו",
      pickDevice: "בחר מכשיר",
      devicesCount: (count: number) => `${count} מכשירים`,
      // מוצע - ממתין לאישור (pending-decisions)
      devicesLoadFailed: "לא ניתן לטעון את המכשירים",
      retry: "נסה שוב",
    },

    validation: {
      datesRequired: "יש לבחור תאריך התחלה ותאריך סיום",
      endBeforeStart: "תאריך הסיום לא יכול להיות לפני תאריך ההתחלה",
      duration: "יש להזין מספר דקות שלם בין 1 ל-120",
      hoursRequired: "יש לבחור שעת התחלה ושעת סיום",
      endTimeBeforeStart: "שעת הסיום חייבת להיות אחרי שעת ההתחלה",
    },
  },
} as const;
