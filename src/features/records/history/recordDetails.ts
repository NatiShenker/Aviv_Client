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
