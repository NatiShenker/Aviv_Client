/*
 * נקודת ההחלפה היחידה ל-MFE של הגורם המאשר: כשה-MFE ישולב, הייבוא כאן יוחלף בייבוא שלו,
 * והתחליף (ApproverPickerStandIn, השירות והנתיב במוק) יימחק. מי שמשתמש ב-ApproverPicker לא משתנה.
 */
export { default } from "./ApproverPickerStandIn";
export type { ApproverPickerProps } from "./approverPickerContract";
