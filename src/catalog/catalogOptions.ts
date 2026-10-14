import type { IpsPillSelectOption, IpsSelectOption } from "ui-library";

// נתוני הדגמה לקטלוג בלבד, לפי הרשימות שבסקיצות. אינם נתוני האפליקציה.

export const REASON_OPTIONS: IpsSelectOption[] = [
  { value: "discipline", label: "הפרת משמעת" },
  { value: "phone-misuse", label: "שימוש לא תקין בטלפון" },
  { value: "therapist-request", label: "בקשת גורם טיפולי" },
  { value: "parents-request", label: "בקשת הורים" },
  { value: "other", label: "אחר" },
];

export const APPROVER_OPTIONS: IpsSelectOption[] = [
  { value: "director", label: "מנהל הפנימייה" },
  { value: "education-coordinator", label: "רכז חינוך" },
  { value: "social-worker", label: "עובד סוציאלי" },
  { value: "counselor", label: "מדריך אחראי" },
];

export const DEVICE_OPTIONS: IpsSelectOption[] = [
  { value: "wing-a", label: "טלפון ציבורי – אגף א" },
  { value: "wing-b", label: "טלפון ציבורי – אגף ב" },
  { value: "wing-c", label: "טלפון ציבורי – אגף ג" },
  { value: "office", label: "טלפון משרד הפנימייה" },
];

export const STATUS_OPTIONS: IpsPillSelectOption[] = [
  { value: "all", label: "הכל" },
  { value: "active", label: "פעיל" },
  { value: "blocked", label: "חסום" },
];

export const SORT_OPTIONS: IpsPillSelectOption[] = [
  { value: "name", label: "שם" },
  { value: "last-date", label: "תאריך אחרון" },
  { value: "stay-time", label: "זמן שהייה" },
];

export const DEMO_RECORD_DETAILS = [
  { label: "תאריכים", value: "01/06/25-05/06/25" },
  { label: "שעות", value: "כל היום" },
  { label: "סיבה", value: "הפרת משמעת" },
  { label: "היקף", value: "כל המכשירים" },
  { label: "גורם מאשר", value: "מנהל הפנימייה" },
];
