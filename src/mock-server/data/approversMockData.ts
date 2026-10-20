import type { ApproverRef } from "@/types/common.schema";

// סימולציה של הגורמים המאשרים. בפרודקשן הבחירה נעשית ב-MFE חיצוני
export const APPROVERS_MOCK_DATA: ApproverRef[] = [
  { id: 1, fullName: "רונית אלמוג", roleTitle: "מנהלת הפנימייה" },
  { id: 2, fullName: "אבי שגיא", roleTitle: "רכז חינוך" },
  { id: 3, fullName: "דנה לוין", roleTitle: "עובדת סוציאלית" },
  { id: 4, fullName: "יואב כרמי", roleTitle: "מדריך אחראי" },
];
