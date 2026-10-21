import type { PhoneString } from "@/types/common.schema";
import { isValidPhone, normalizePhone } from "@/utils/phone";
import { FORM_TEXTS } from "../formTexts";

const TEXTS = FORM_TEXTS.phone;

/** תוצאת "הוספה": הרשימה החדשה, או שגיאה לשדה */
export type AddPhoneResult = { phones: PhoneString[] } | { error: string };

/**
 * "הוספה" בשדה של כמה מספרים (ספק 04 form §4.7): מנרמלים; לא תקין - שגיאה; כבר ברשימה - שגיאה.
 * שדה ריק - אין שינוי.
 */
export function tryAddPhone(draft: string, phones: PhoneString[]): AddPhoneResult {
  const phone = normalizePhone(draft);
  if (!phone) return { phones };
  if (!isValidPhone(phone)) return { error: TEXTS.invalid };
  if (phones.includes(phone)) return { error: TEXTS.duplicate };
  return { phones: [...phones, phone] };
}

/**
 * בשמירה, מספר שנשאר בשדה נוסף אוטומטית כשהוא תקין (ומדולג בשקט אם כבר ברשימה);
 * כשהוא לא תקין - שגיאה. בסוף צריך לפחות מספר אחד.
 */
export function commitPendingPhone(draft: string, phones: PhoneString[]): AddPhoneResult {
  const phone = normalizePhone(draft);
  if (phone && !isValidPhone(phone)) return { error: TEXTS.invalid };

  const committedPhones = phone && !phones.includes(phone) ? [...phones, phone] : phones;
  if (committedPhones.length === 0) return { error: TEXTS.required };
  return { phones: committedPhones };
}
