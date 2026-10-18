/**
 * מזהי ההרשאות שחוזרים מ-GetPermissionsForInstitution: לכל פעולה על חניך הרשאה משלה,
 * ו"מידע נוסף" דורש הרשאה כללית אחת. המספרים זמניים עד שיוגדרו מול הסרביס (ראו pending-decisions).
 */
export const PERMISSION_IDS = {
  traineeRestriction: 1,
  numberRestriction: 2,
  voiceMessage: 3,
  additionalInfo: 4,
} as const;

export type PermissionId = (typeof PERMISSION_IDS)[keyof typeof PERMISSION_IDS];
