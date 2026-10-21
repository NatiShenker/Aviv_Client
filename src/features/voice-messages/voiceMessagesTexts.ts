// בתוך המסך ההקשר ברור, ולכן "הודעה לנמען"; בלי הקשר (תפריט, כותרת המסך) - "הודעה קולית לנמען"
export const VOICE_MESSAGES_TEXTS = {
  title: "הודעה קולית לנמען",

  toolbar: {
    sectionTitle: "היסטוריית הודעות לנמען",
    searchLabel: "חיפוש הודעות לנמען",
    searchPlaceholder: "חיפוש חופשי",
    // מתחת לחיפוש, במין של הרשומה (הוחלט 2026-10-21)
    resultsCount: (count: number) => (count === 1 ? "מוצגת הודעה אחת" : `מוצגות ${count} הודעות`),
  },

  // מיון הסטטוס בהיסטוריה, במין של הרשומה (הוחלט 2026-10-21)
  statusSort: {
    activeFirst: "סטטוס: פעילות תחילה",
    endedFirst: "סטטוס: שהסתיימו תחילה",
  },

  card: {
    activeBadge: "פעילה",
    endedBadge: "הסתיימה",
    allCalls: "כל השיחות",
    // הוחלט 2026-10-21
    createBasedOn: "יצירת הודעה דומה",
  },

  details: {
    repeatDuringCall: "הודעה חוזרת",
    yes: "כן",
    no: "לא",
  },

  states: {
    // מוצעים - ממתינים לאישור (pending-decisions)
    loading: "טוען הודעות לנמען…",
    loadFailed: "לא ניתן לטעון את ההודעות לנמען",
    noResults: "לא נמצאו הודעות לנמען",
  },

  newRecord: "הוספת הודעה לנמען",

  form: {
    // שאלה פתוחה (pending-decisions): אפשר לקרוא את הכותרת כ"נמען חדש"
    createTitle: "הודעה לנמען חדשה",
    editTitle: "עריכת הודעה לנמען",
    save: "שמירה",
    // מוצע - ממתין לאישור (pending-decisions). כל מספר נשמר כהודעה נפרדת
    savedToast: (savedCount: number) => (savedCount > 1 ? "ההודעות נשמרו" : "ההודעה נשמרה"),

    messageBlock: {
      title: "ההודעה",
      contentLabel: "תוכן ההודעה:",
      content: (traineeFullName: string) => `שלום, זוהי שיחה מהפנימייה מהחניך ${traineeFullName}`,
      scopeTitle: "היקף ההפעלה",
      scopes: {
        all: { label: "בכל השיחות", description: "לפני כל שיחה שהחניך מבצע" },
        selected: { label: "רק במספרים נבחרים", description: "רק בשיחות למספרים שיוגדרו" },
      },
      phoneHint: "ניתן להזין מספר אחד או יותר. כל מספר יישמר כהודעה נפרדת",
    },

    // מוצע - ממתין לאישור (pending-decisions)
    lockedScope: {
      selected: "רק במספר נבחר",
    },

    detailsBlock: {
      title: "פרטי ההודעה",
      repeatLabel: "הודעה חוזרת",
      // המרווח קבוע ולא ניתן לשינוי
      repeatHint: "ההודעה תושמע שוב כל 5 דקות, כל עוד השיחה פעילה",
    },
  },
} as const;
