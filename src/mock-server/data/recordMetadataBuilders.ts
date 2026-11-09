import type { ApprovedFileDto, AuditMetadataDto, DecisionApprovalDto, ISODateString } from "@/types/common.schema";
import { dateTimeDaysFromToday, hasEnded } from "../mockDates";
import { APPROVERS_MOCK_DATA } from "./approversMockData";

// בוני עזר משותפים לרשומות ההגבלה, ההיתר וההודעה במוק (אישור וקובץ, ושדות audit)

/** תיקיית ה-SharePoint המדומה של קובצי האישור. שם הקובץ הוא הקטע האחרון של הנתיב (D-13) */
export const MOCK_SHAREPOINT_FOLDER = "/sites/aviv/approvals";
const PATH_SEPARATOR = "/";

const DECISION_FILE_EXTENSION = ".pdf";
const DECISION_FILE_PREFIX = "החלטה-";

/** שורת AVIV_FILE: המזהה, שם הקובץ והנתיב ב-SharePoint שממנו השרת גוזר את השם */
export function buildApprovedFile(fileId: number, fileName: string): ApprovedFileDto {
  return { id: fileId, fileName, textFile: `${MOCK_SHAREPOINT_FOLDER}${PATH_SEPARATOR}${fileName}` };
}

/** האישור של רשומת מוק: המאשר לפי המזהה (כמו ה-JOIN בשרת), וקובץ אישור בשם קבוע לפי מזהה הקובץ */
export function buildDecisionApproval(fileId: number, textReason: string): DecisionApprovalDto {
  return {
    textReason,
    approver: APPROVERS_MOCK_DATA[fileId % APPROVERS_MOCK_DATA.length],
    approvedFile: buildApprovedFile(fileId, `${DECISION_FILE_PREFIX}${fileId}${DECISION_FILE_EXTENSION}`),
  };
}

/** שדות ה-audit של רשומה שנוצרה לפני createdDaysFromToday ימים ולא עודכנה; isEnded לפי תאריך הסיום, כמו בפרוצדורות */
export function buildAuditMetadata(
  endDate: ISODateString,
  createdDaysFromToday: number,
  idntUserUpdate: number,
): AuditMetadataDto {
  return {
    isEnded: hasEnded(endDate),
    dateCreated: dateTimeDaysFromToday(createdDaysFromToday),
    dateUpdated: null,
    idntUserUpdate,
  };
}
