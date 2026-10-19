// בתוך המסך ההקשר ברור, ולכן "הודעה לנמען"; בלי הקשר (תפריט, כותרת המסך) - "הודעה קולית לנמען"
export const VOICE_MESSAGES_TEXTS = {
  title: "הודעה קולית לנמען",

  toolbar: {
    sectionTitle: "היסטוריית הודעות לנמען",
    searchLabel: "חיפוש הודעות לנמען",
    searchPlaceholder: "חיפוש לפי מספר, סיבה או תאריך",
  },

  card: {
    activeBadge: "פעילה",
    allCalls: "כל השיחות",
    // מוצע - ממתין לאישור (pending-decisions)
    createBasedOn: "צור הודעה חדשה על בסיס זו",
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
    createTitle: "הודעה לנמען חדשה",
    editTitle: "עריכת הודעה לנמען",
    save: "שמור",

    messageBlock: {
      title: "ההודעה",
      contentLabel: "תוכן ההודעה:",
      content: (traineeFullName: string) => `שלום, זוהי שיחה מהפנימייה מהחניך ${traineeFullName}`,
      scopeTitle: "היקף ההפעלה",
      scopes: {
        all: { label: "בכל השיחות", description: "לפני כל שיחה שהחניך מבצע" },
        selected: { label: "רק במספרים נבחרים", description: "הגדר את המספרים שבהם תופעל ההודעה" },
      },
      phoneHint: "הזן מספר אחד או יותר. כל מספר יישמר כהודעה נפרדת",
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
      dateRangeDescription: "ההודעה תופעל בתאריכים אלו בלבד",
    },
  },
} as const;
