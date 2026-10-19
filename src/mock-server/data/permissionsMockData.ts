import { PERMISSION_IDS } from "@/features/institutes/permissionIds";

// בשלב הזה המשתמש מקבל הרשאות מלאות בכל פנימייה. לבדיקת "אין הרשאה" - mockEmpty=permissions
const ALL_PERMISSION_IDS: number[] = Object.values(PERMISSION_IDS);

/** מזהי ההרשאות של המשתמש, לפי מזהה פנימייה */
export const PERMISSIONS_BY_INSTITUTE_MOCK_DATA: Record<number, number[]> = {
  101: ALL_PERMISSION_IDS,
  102: ALL_PERMISSION_IDS,
  103: ALL_PERMISSION_IDS,
};
