/*
 * שמירה בזכרון המקומי עם תוקף. כל שמירה מחדשת את התוקף.
 * בתוך iframe הדפדפן עלול לחסום את localStorage; במקרה כזה האפליקציה ממשיכה לעבוד בלי שמירה.
 */

const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

interface StoredEntry {
  value: unknown;
  expiresAt: number;
}

export function saveWithExpiry(key: string, value: unknown, ttlDays: number): void {
  const entry: StoredEntry = { value, expiresAt: Date.now() + ttlDays * MILLISECONDS_IN_DAY };
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // הזכרון המקומי חסום או מלא - השמירה פשוט לא מתבצעת
  }
}

/** מחזיר את הערך השמור רק אם הוא בתוקף ועובר את בדיקת המבנה. אחרת null */
export function readWithExpiry<TValue>(
  key: string,
  isValidValue: (value: unknown) => value is TValue,
): TValue | null {
  const entry = readEntry(key);
  if (!entry) {
    return null;
  }
  if (Date.now() > entry.expiresAt || !isValidValue(entry.value)) {
    removeStoredItem(key);
    return null;
  }
  return entry.value;
}

export function removeStoredItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // הזכרון המקומי חסום - אין מה למחוק
  }
}

function readEntry(key: string): StoredEntry | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return isStoredEntry(parsed) ? parsed : null;
  } catch {
    // הזכרון המקומי חסום, או שהערך השמור אינו JSON תקין
    return null;
  }
}

function isStoredEntry(value: unknown): value is StoredEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    typeof (value as Partial<StoredEntry>).expiresAt === "number"
  );
}
