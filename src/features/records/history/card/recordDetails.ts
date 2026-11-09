import type { DecisionApprovalDto } from "@/types/common.schema";
import { HISTORY_TEXTS } from "../historyTexts";

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

type DecisionDisplayFields = Pick<DecisionApprovalDto, "textReason" | "approver">;

/**
 * "למה ומי" – אחרונים בכרטיס הפתוח (ספק 00 §3.22): גורם מאשר, ופירוט לכל הרוחב כשיש.
 * הסיבה מהרשימה הסגורה אינה מוחזרת מהשרת (I-23), ולכן אין לה שורה כאן; פעולה שהרשומה שלה עדיין נושאת סיבה
 * מוסיפה אותה בעצמה (buildReasonDetailItem)
 */
export function buildDecisionDetailItems(record: DecisionDisplayFields): DetailItem[] {
  const items: DetailItem[] = [
    { key: "approver", label: TEXTS.approver, value: record.approver.fullName || TEXTS.notSpecified },
  ];
  if (record.textReason) {
    items.push({ key: "details", label: TEXTS.details, value: record.textReason, isFullWidth: true });
  }
  return items;
}

/** שורת "סיבה" לרשומה שנושאת סיבה מהרשימה הסגורה; ריקה - "לא צוין" */
export function buildReasonDetailItem(reason: string): DetailItem {
  return { key: "reason", label: TEXTS.reason, value: reason || TEXTS.notSpecified };
}

/** הערכים של "סיבות ואישורים" שהחיפוש בהיסטוריה בודק */
export function decisionSearchParts(record: DecisionDisplayFields): string[] {
  return [record.textReason, record.approver.fullName];
}
