import type { LookupItem } from "@/types/common.schema";

// רשימות הסיבות לפי ספק 00 §6

export const TRAINEE_RESTRICTION_REASONS_MOCK_DATA: LookupItem<number>[] = [
  { id: 1, name: "הפרת משמעת" },
  { id: 2, name: "שימוש לא תקין בטלפון" },
  { id: 3, name: "בקשת גורם טיפולי" },
  { id: 4, name: "בקשת הורים" },
  { id: 5, name: "אחר" },
];

export const PHONE_EXCEPTION_REASONS_MOCK_DATA: LookupItem<number>[] = [
  { id: 1, name: "מורשה לזמן מוגבל" },
  { id: 2, name: "קשר עם בן משפחה" },
  { id: 3, name: "קשר עם גורם טיפולי" },
  { id: 4, name: "בקשת הורים" },
  { id: 5, name: "אחר" },
];

export const VOICE_MESSAGE_REASONS_MOCK_DATA: LookupItem<number>[] = [
  { id: 1, name: "זיהוי מקור השיחה" },
  { id: 2, name: "בקשת הורים" },
  { id: 3, name: "בקשת גורם טיפולי" },
  { id: 4, name: "הנחיית הנהלה" },
  { id: 5, name: "אחר" },
];
