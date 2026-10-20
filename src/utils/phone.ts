import type { PhoneString } from "@/types/common.schema";

// ספק 00 §5: מוחקים רווחים, סוגריים ומקפים. תקין: נייח (9 ספרות) או נייד (10 ספרות) שמתחילים ב-0 (OQ-20)
const PHONE_FORMATTING_CHARACTERS = /[\s()-]/g;
const VALID_PHONE_PATTERN = /^0\d{8,9}$/;

export function normalizePhone(value: string): PhoneString {
  return value.replace(PHONE_FORMATTING_CHARACTERS, "");
}

export function isValidPhone(phone: PhoneString): boolean {
  return VALID_PHONE_PATTERN.test(phone);
}
