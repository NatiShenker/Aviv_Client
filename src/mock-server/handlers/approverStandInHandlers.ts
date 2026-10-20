import type { SearchApproversRequest } from "@/integrations/approver-mfe/approversStandInService";
import type { ApproverRef } from "@/types/common.schema";
import { APPROVERS_MOCK_DATA } from "../data/approversMockData";
import type { MockRequest } from "../mockRequest";

// סימולציה של החיפוש ב-MFE של הגורם המאשר: לפי שם או תפקיד
export function handleSearchApprovers(request: MockRequest): ApproverRef[] {
  const { query } = request.params as SearchApproversRequest;
  const trimmedQuery = query.trim();

  return APPROVERS_MOCK_DATA.filter(
    (approver) => approver.fullName.includes(trimmedQuery) || (approver.roleTitle ?? "").includes(trimmedQuery),
  );
}
