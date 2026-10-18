import type { FileAttachmentRef } from "@/schemas/common.schema";
import { TRAINEE_PHONE_RECORDS_MOCK_DATA } from "./traineePhoneRecordsMockData";
import { TRAINEE_RESTRICTIONS_MOCK_DATA } from "./traineeRestrictionsMockData";

// קבצי האסמכתא הרשומים: הקבצים של הרשומות הקיימות, ואליהם נוספים קבצים שהועלו בביקור הנוכחי
export const APPROVED_FILES_MOCK_DATA: FileAttachmentRef[] = [
  ...TRAINEE_RESTRICTIONS_MOCK_DATA.map((restriction) => restriction.approvedFile),
  ...TRAINEE_PHONE_RECORDS_MOCK_DATA.map((phoneRecord) => phoneRecord.approvedFile),
];
