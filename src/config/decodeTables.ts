/**
 * מספרי טבלאות הקוד ב-AVIV_DECODE (CODE_TABLE) שהקליינט מבקש ב-Lookups/GetDecode.
 * מראָה של Utils/DecodeTables.cs בסרביס - שינוי מספר הוא עריכה אחת בכל צד.
 * המספרים זמניים עד שה-DBA יקבע אותם (KQ-1); עד אז השרת מחזיר רשימות ריקות והקליינט נופל ל-mock (K-6, reasonsService)
 */
export const DECODE_TABLES = {
  /** סיבות להגבלה לחניך (03) */
  traineeRestrictionReasons: 1,
  /** סיבות להגבלה ולהיתר למספר (04) */
  phoneExceptionReasons: 2,
  /** סיבות להודעה קולית (05) */
  voiceMessageReasons: 3,
} as const;
