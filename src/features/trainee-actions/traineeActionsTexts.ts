export const TRAINEE_ACTIONS_TEXTS = {
  sections: {
    actions: "פעולות",
    additionalInfo: "מידע נוסף",
  },

  items: {
    traineeRestriction: "הגבלה/היתר לחניך",
    numberRestriction: "הגבלה/היתר למספר",
    voiceMessage: "הודעה קולית לנמען",
    // "היסטוריית" בכל המסכים (הוחלט 2026-10-18)
    minutesHistory: "היסטוריית דקות",
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
