// רווח קשיח, כדי ש"עד X דק'" לא יישבר בין שורות (ספק 00 §5)
const NO_BREAK_SPACE = " ";

const durationUpTo = (minutes: number) => `עד${NO_BREAK_SPACE}${minutes}${NO_BREAK_SPACE}דק'`;

/** טקסטים משותפים לתנאי השיחה בהגבלות ובהיתרים: ערכי תצוגה והודעות ולידציה (ספק 00 §5, ספק 03-04 §5) */
export const CALL_CONDITIONS_TEXTS = {
  values: {
    allDay: "כל היום",
    allDevices: "כל המכשירים",
    notSet: "לא הוגדרו",
    devicesCount: (count: number) => `${count} מכשירים`,
    durationUpTo,
  },

  // תווית הסוג בכרטיס (ספק 03 overview §3.1, ספק 04 overview §3)
  typeLabels: {
    restriction: {
      full: "הגבלה מלאה",
      limited: (minutes: number) => `הגבלת משך שיחה – ${durationUpTo(minutes)}`,
    },
    permit: {
      full: "היתר מלא",
      limited: (minutes: number) => `היתר עם הגבלת משך – ${durationUpTo(minutes)}`,
    },
  },

  validation: {
    datesRequired: "יש לבחור תאריך התחלה ותאריך סיום",
    endBeforeStart: "תאריך הסיום לא יכול להיות לפני תאריך ההתחלה",
    duration: (minMinutes: number, maxMinutes: number) => `יש להזין מספר דקות שלם בין ${minMinutes} ל-${maxMinutes}`,
    hoursRequired: "יש לבחור שעת התחלה ושעת סיום",
    endTimeBeforeStart: "שעת הסיום חייבת להיות אחרי שעת ההתחלה",
  },
} as const;
