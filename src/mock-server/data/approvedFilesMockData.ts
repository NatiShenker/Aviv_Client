import type { FileAttachmentRef } from "@/schemas/common.schema";
import { TRAINEE_RESTRICTIONS_MOCK_DATA } from "./traineeRestrictionsMockData";

// קבצי האסמכתא הרשומים: הקבצים של ההגבלות הקיימות, ואליהם נוספים קבצים שהועלו בביקור הנוכחי
export const APPROVED_FILES_MOCK_DATA: FileAttachmentRef[] = TRAINEE_RESTRICTIONS_MOCK_DATA.map(
  (restriction) => restriction.approvedFile,
);
