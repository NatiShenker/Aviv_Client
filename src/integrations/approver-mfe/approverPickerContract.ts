import type { ApproverRef } from "@/schemas/common.schema";

/** החוזה של ה-MFE החיצוני לבחירת גורם מאשר: מחזיר את הגורם שנבחר */
export interface ApproverPickerProps {
  onSelect: (approver: ApproverRef) => void;
}
