import type { DecisionApprovalDto } from "@/schemas/common.schema";
import { HISTORY_TEXTS } from "./historyTexts";

const TEXTS = HISTORY_TEXTS.details;

/** פרט אחד ברשומה פתוחה */
export interface DetailItem {
  key: string;
  label: string;
  value: string;
  /** תאריכים, שעות וטלפונים נקראים משמאל לימין */
  isLtr?: boolean;
  /** פרט שתופס את שתי העמודות (למשל פירוט) */
  isFullWidth?: boolean;
}

type DecisionDisplayFields = Pick<DecisionApprovalDto, "reason" | "details" | "approver">;

/** "למה ומי" – אחרונים בכרטיס הפתוח (ספק 00 §3.22): סיבה, גורם מאשר, ופירוט לכל הרוחב כשיש */
export function buildDecisionDetailItems(record: DecisionDisplayFields): DetailItem[] {
  const items: DetailItem[] = [
    { key: "reason", label: TEXTS.reason, value: record.reason || TEXTS.notSpecified },
    { key: "approver", label: TEXTS.approver, value: record.approver.fullName || TEXTS.notSpecified },
  ];
  if (record.details) {
    items.push({ key: "details", label: TEXTS.details, value: record.details, isFullWidth: true });
  }
  return items;
}

/** הערכים של "סיבות והחלטה" שהחיפוש בהיסטוריה בודק */
export function decisionSearchParts(record: DecisionDisplayFields): string[] {
  return [record.reason, record.details, record.approver.fullName];
}
