import type { RadioFieldOption } from "@/shared/components/form/formControls";
import type { TraineePhoneRecordType } from "../numberRestrictionsLogic";
import { NUMBER_RESTRICTIONS_TEXTS } from "../numberRestrictionsTexts";

const RECORD_TYPE_TEXTS = NUMBER_RESTRICTIONS_TEXTS.recordTypes;
const DESCRIPTION_TEXTS = NUMBER_RESTRICTIONS_TEXTS.form.actionType.descriptions;

interface RecordTypeOption extends RadioFieldOption {
  value: TraineePhoneRecordType;
}

/** "הגבלה או היתר" ביצירה: היתר (ברירת המחדל) או הגבלה, כל אחד עם ההשלכה שלו (ספק 04 form §3.2) */
export const RECORD_TYPE_OPTIONS: RecordTypeOption[] = [
  { value: "permit", label: RECORD_TYPE_TEXTS.permit, description: DESCRIPTION_TEXTS.permit },
  { value: "restriction", label: RECORD_TYPE_TEXTS.restriction, description: DESCRIPTION_TEXTS.restriction },
];

export function isNumberRecordType(value: string | number): value is TraineePhoneRecordType {
  return RECORD_TYPE_OPTIONS.some((option) => option.value === value);
}
