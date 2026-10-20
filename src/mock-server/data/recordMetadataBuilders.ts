import type { AuditMetadataDto, DecisionApprovalDto, ISODateString } from "@/types/common.schema";
import { dateTimeDaysFromToday, temporalStatusOf } from "../mockDates";
import { APPROVERS_MOCK_DATA } from "./approversMockData";

// בוני עזר משותפים לרשומות ההגבלה וההיתר במוק (החלטה ואישור, ושדות audit)

const DECISION_FILE_EXTENSION = ".pdf";
const DECISION_FILE_PREFIX = "החלטה-";

export function buildDecisionApproval(recordId: number, reason: string): DecisionApprovalDto {
  return {
    reason,
    details: "",
    approver: APPROVERS_MOCK_DATA[recordId % APPROVERS_MOCK_DATA.length],
    approvedFile: { id: recordId, fileName: `${DECISION_FILE_PREFIX}${recordId}${DECISION_FILE_EXTENSION}` },
  };
}

export function buildAuditMetadata(
  startDate: ISODateString,
  endDate: ISODateString,
  createdDaysFromToday: number,
  updatedByUserId: number,
): AuditMetadataDto {
  return {
    isActive: true,
    temporalStatus: temporalStatusOf(startDate, endDate),
    syncStatus: "synced",
    createdAt: dateTimeDaysFromToday(createdDaysFromToday),
    updatedAt: null,
    updatedByUserId,
  };
}
