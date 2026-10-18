import type { TraineePhoneRecordType } from "@/schemas/phone-exceptions.schema";
import { NUMBER_RESTRICTIONS_TEXTS } from "./numberRestrictionsTexts";

const RECORD_TYPE_TEXTS = NUMBER_RESTRICTIONS_TEXTS.recordTypes;

/** "סוג הפעולה" ביצירה: היתר (ברירת המחדל) או הגבלה (ספק 04 form §3.2) */
export const RECORD_TYPE_OPTIONS: { value: TraineePhoneRecordType; label: string }[] = [
  { value: "permit", label: RECORD_TYPE_TEXTS.permit },
  { value: "restriction", label: RECORD_TYPE_TEXTS.restriction },
];

export function isNumberRecordType(value: string | number): value is TraineePhoneRecordType {
  return RECORD_TYPE_OPTIONS.some((option) => option.value === value);
}
