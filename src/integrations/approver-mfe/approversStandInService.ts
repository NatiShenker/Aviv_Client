import { serviceClient } from "@/infrastructure/serviceClient";
import type { ApproverRef } from "@/types/common.schema";

/*
 * הנתונים של התחליף ל-MFE של הגורם המאשר. ה-MFE האמיתי מביא את הגורמים בעצמו, ולכן כל הקובץ הזה
 * (כולל הנתיב במוק) יימחק כשה-MFE ישולב. הפעולה והפרמטרים קיימים רק בסימולציה.
 */

export const APPROVER_STAND_IN_ENDPOINTS = {
  searchApprovers: "ApproverMfe/SearchApprovers",
} as const;

export interface SearchApproversRequest {
  query: string;
}

export async function searchApprovers(query: string): Promise<ApproverRef[]> {
  const request: SearchApproversRequest = { query };
  return serviceClient.get<ApproverRef[]>(APPROVER_STAND_IN_ENDPOINTS.searchApprovers, request);
}
