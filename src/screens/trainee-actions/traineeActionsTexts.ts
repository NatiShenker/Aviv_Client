export const TRAINEE_ACTIONS_TEXTS = {
  sections: {
    actions: "פעולות",
    additionalInfo: "מידע נוסף",
  },

  items: {
    traineeRestriction: "הגבלה/היתר לחניך",
    numberRestriction: "הגבלה/היתר למספר",
    voiceMessage: "הוספת הודעה קולית",
    // האיות כמו בספק 02 (שונה מ"הסטוריית" - ראו OQ-08)
    minutesHistory: "הסטורית דקות",
  },

  states: {
    loadingActions: "טוען פעולות…",
    // מוצע - ממתין לאישור (pending-decisions)
    noPermittedActions: "אין לך הרשאה לפעולות על חניכים בפנימייה זו",
  },
} as const;
