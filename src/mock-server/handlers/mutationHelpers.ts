import type { ApprovalInput, DecisionApprovalDto, ISODateString, MutationResultDto } from "@/types/common.schema";
import { APPROVERS_MOCK_DATA } from "../data/approversMockData";
import type { StoredRecord } from "../data/storedRecords";
import { hasEnded } from "../mockDates";
import { throwConflictError } from "../mockRequest";
import { SERVER_FIELDS } from "./recordInputValidation";

// עזרים משותפים לפעולות השמירה במוק (יצירה ועדכון של הגבלות, היתרים והודעות)

// המשתמש המחובר עדיין לא מדומה (shared-types); מזהה קבוע לדוגמה
export const MOCK_CURRENT_USER_ID = 1;

// מזהי שורות AVIV_FILE של קבצים שנשמרו בביקור הנוכחי, אחרי אלה שבנתוני המוק (D-13: שורת קובץ לכל שמירה)
const NEW_FILE_ID_BASE = 90000;
let lastFileId = NEW_FILE_ID_BASE;

/** מזהה חדש: אחד יותר מהגבוה ביותר שקיים */
export function nextRecordId(records: { id: number }[]): number {
  return Math.max(0, ...records.map((record) => record.id)) + 1;
}

/** מזהה שורת AVIV_FILE חדשה, כמו SCOPE_IDENTITY בפרוצדורה */
export function allocateFileId(): number {
  lastFileId += 1;
  return lastFileId;
}

/** תשובת השמירה: המזהים שנוצרו בלבד (A-14, I-20) */
export function toMutationResult(createdIds: number[]): MutationResultDto {
  return { createdIds };
}

const PATH_SEPARATORS = /[\\/]/;

/** D-13: שם הקובץ הוא הקטע האחרון של הנתיב (FilePaths.FileNameFromPath) */
function fileNameFromPath(path: string): string {
  const segments = path.split(PATH_SEPARATORS);
  return segments[segments.length - 1];
}

/**
 * פרטי האישור של רשומה שנשמרה: המאשר לפי המזהה (כמו ה-JOIN ל-A_WORKERS בשרת; בלי שורה - שם ריק, C-8),
 * והקובץ מהנתיב שנשלח, עם שורת AVIV_FILE חדשה (D-13)
 */
export function decisionFromInput(textReason: string, approval: ApprovalInput, fileId: number): DecisionApprovalDto {
  const approver = APPROVERS_MOCK_DATA.find((candidate) => candidate.id === approval.idntUserApproval) ?? {
    id: approval.idntUserApproval,
    fullName: "",
  };
  const fileName = approval.textFileName || fileNameFromPath(approval.textFile);
  return { textReason, approver, approvedFile: { id: fileId, fileName, textFile: approval.textFile } };
}

/**
 * "תפיסת הגרסה הקודמת" (A-2, D-1): הרשומה שמוחלפת חייבת להיות קיימת, פעילה ולא הסתיימה - אחרת 409 idntPrevious,
 * כמו UPDATE ... WHERE LOGI_ACTIVE = 1 AND DATE_END >= today בפרוצדורות. רשומה שהסתיימה לא נערכת (ספק 00 §3.22)
 */
export function findReplaceableRecord<TRecord extends { id: number; dateEnd: ISODateString }>(
  records: StoredRecord<TRecord>[],
  previousId: number,
): StoredRecord<TRecord> {
  const previous = records.find((record) => record.id === previousId);
  if (!previous || !previous.isActive || hasEnded(previous.dateEnd)) {
    throwConflictError(SERVER_FIELDS.idntPrevious);
  }
  return previous;
}
