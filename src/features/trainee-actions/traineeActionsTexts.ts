export const TRAINEE_ACTIONS_TEXTS = {
  sections: {
    actions: "פעולות",
    additionalInfo: "מידע נוסף",
  },

  items: {
    // הוחלט 2026-10-21
    traineeRestriction: "הגבלות לחניך",
    numberRestriction: "הגבלות והיתרים למספר",
    voiceMessage: "הודעה קולית לנמען",
    // "היסטוריית" בכל המסכים (הוחלט 2026-10-18)
    minutesHistory: "היסטוריית דקות",
  },

  // שורת ההסבר מתחת לתווית במסך הפעולות (הוחלט 2026-10-21). ל"היסטוריית דקות" אין הסבר
  itemDescriptions: {
    traineeRestriction: "חסימת השיחות של החניך, מלאה או לפי משך שיחה",
    numberRestriction: "חסימה או פתיחה של מספרי טלפון מסוימים",
    voiceMessage: "הודעה שמושמעת לנמען בשיחות של החניך",
  },

  states: {
    loadingActions: "טוען פעולות…",
    // מוצע - ממתין לאישור (pending-decisions)
    noPermittedActions: "אין לך הרשאה לפעולות על חניכים בפנימייה זו",
  },

  // דסקטופ: מגירת החניך. מוצעים - ממתינים לאישור (pending-decisions)
  drawer: {
    close: "סגירה",
    backToActions: "חזרה לפעולות",
    switchAction: "החלפת פעולה",
  },

  // דסקטופ: תפריט ⋮ על כרטיס החניך. מוצעים - ממתינים לאישור (pending-decisions)
  cardMenu: {
    label: (traineeDisplayName: string) => `פעולות עבור ${traineeDisplayName}`,
    allActions: "כל הפעולות",
  },
} as const;
