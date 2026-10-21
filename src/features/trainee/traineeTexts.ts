export const TRAINEE_TEXTS = {
  // מוצע - ממתין לאישור ולעיצוב של מסך "לא נמצא" (OQ-21)
  notFound: "החניך לא נמצא",
  /** בין השם למספר האישי: "יוסי כהן | 012453" */
  nameSeparator: " | ",
  /** בשם הנגיש: פסיק ולא "|", שקורא מסך משמיע כ"קו אנכי" - "יוסי כהן, 012453" */
  accessibleNameSeparator: ", ",

  // התגית בכרטיס החניך - רק כשיש הגבלה פעילה
  statusBadge: {
    restrictedUntil: "מוגבל עד",
  },
} as const;
