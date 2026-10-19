import { HTTP_STATUS } from "@/infrastructure/http/httpStatus";
import type {
  DecisionApprovalDto,
  DecisionApprovalInput,
  ISODateString,
  LookupItem,
  MutationResultDto,
} from "@/schemas/common.schema";
import { todayIsoDate } from "@/shared/dates/isoDate";
import { APPROVED_FILES_MOCK_DATA } from "../data/approvedFilesMockData";
import { APPROVERS_MOCK_DATA } from "../data/approversMockData";
import { DEVICES_MOCK_DATA } from "../data/devicesMockData";
import { MockHandlerError } from "../mockRequest";

// עזרים משותפים לפעולות השמירה במוק (יצירה ועדכון של הגבלות והיתרים)

// המשתמש המחובר עדיין לא מדומה (shared-types); מזהה קבוע לדוגמה
export const MOCK_CURRENT_USER_ID = 1;
const REQUEST_UID_PREFIX = "REQ-";

/** מזהה חדש: אחד יותר מהגבוה ביותר שקיים */
export function nextRecordId(records: { id: number }[]): number {
  return Math.max(0, ...records.map((record) => record.id)) + 1;
}

/** תשובת השמירה: מזהי הרשומות החדשות, והרשומות עצמן */
export function toMutationResult<TRecord extends { id: number }>(records: TRecord[]): MutationResultDto<TRecord> {
  return {
    createdIds: records.map((record) => record.id),
    requestUid: `${REQUEST_UID_PREFIX}${Date.now()}`,
    syncStatus: "pending",
    records,
  };
}

/** המכשירים המלאים (מזהה + שם) לפי המזהים שנשלחו, כמו JOIN בשרת */
export function devicesFromIds(deviceIds: number[]): LookupItem<number>[] {
  return DEVICES_MOCK_DATA.filter((device) => deviceIds.includes(device.id)).map(({ id, name }) => ({ id, name }));
}

/** פרטי ההחלטה המלאים לפי המזהים שנשלחו. נקרא אחרי הוולידציה, ולכן הגורם המאשר והקובץ קיימים */
export function decisionFromInput(input: DecisionApprovalInput): DecisionApprovalDto {
  const approver = APPROVERS_MOCK_DATA.find((candidate) => candidate.id === input.approverId);
  const approvedFile = APPROVED_FILES_MOCK_DATA.find((file) => file.id === input.approvedFileId);
  if (!approver || !approvedFile) {
    throw new Error("Approver and approved file must exist after validation");
  }
  return { reason: input.reason, details: input.details, approver, approvedFile };
}

export function throwNotFound(message: string): never {
  throw new MockHandlerError(HTTP_STATUS.notFound, { code: "NOT_FOUND", message });
}

export function throwConflict(message: string): never {
  throw new MockHandlerError(HTTP_STATUS.conflict, { code: "CONFLICT", message });
}

/** רשומה שהסתיימה לא נערכת - יוצרים רשומה חדשה על בסיסה (ספק 00 §3.22). השרת חוזר על הכלל של הקליינט */
export function throwIfEnded(record: { endDate: ISODateString }, description: string): void {
  if (record.endDate < todayIsoDate()) {
    throwConflict(`${description} has ended and cannot be edited`);
  }
}
