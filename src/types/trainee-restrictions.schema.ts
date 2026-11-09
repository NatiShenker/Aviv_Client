/**
 * @file trainee-restrictions.schema.ts
 * @description סכמות עבור פעולת "הגבלות לחניך" (חסימה נקודתית ללא מספר טלפון)
 * מסך: BlockForm.tsx | טבלה ראשית: AVIV_TRAINEE_RESTRICTION
 * החוזה של TraineeRestrictionsController (service-layer/Models/TraineeRestrictions).
 */

import type {
  ApprovalInput,
  AuditMetadataDto,
  DecisionApprovalDto,
  ISODateString,
  MutationResultDto,
  PermittedCallConditionsDto,
  PermittedCallConditionsInput,
} from "./common.schema.ts";

// ============================================================================
// 1. שליפת הגבלות קיימות של חניך (POST TraineeRestrictions/GetTraineeRestrictions)
// ============================================================================

export interface GetTraineeRestrictionsRequest {
  /** מערך מזהי חניכים (לסקיילביליות; במסך חניך בודד נשלח [traineeId]) */
  idntTraineeList: number[];
}

export interface TraineeRestrictionRecordDto
  extends PermittedCallConditionsDto,
    DecisionApprovalDto,
    AuditMetadataDto {
  /** מזהה הרשומה בטבלת AVIV_TRAINEE_RESTRICTION (IDNT_AVIV_TRAINEE_RESTRICTION); idntPrevious של עדכון */
  id: number;
  /** מזהה החניך (IDNT_TRAINEE) */
  idntTrainee: number;
  /** תאריך תחילת ההגבלה (DATE_RESTRICTION_START) */
  dateStart: ISODateString;
  /** תאריך סיום ההגבלה (DATE_RESTRICTION_END) */
  dateEnd: ISODateString;
}

export interface GetTraineeRestrictionsResponse {
  records: TraineeRestrictionRecordDto[];
}

// ============================================================================
// 2. השדות המשותפים ליצירה ולעדכון
// ============================================================================

export interface TraineeRestrictionSaveFields extends PermittedCallConditionsInput, ApprovalInput {
  dateRestrictionStart: ISODateString;
  dateRestrictionEnd: ISODateString;
  /** הפירוט בטקסט חופשי (TEXT_RESTRICTION_REASON) */
  textRestrictionReason: string;
  /**
   * קוד הסיבה מהרשימה הסגורה. השרת מקבל אותו ומעביר לפרוצדורה, ולא שומר אותו עד שתהיה עמודה CODE_RESTRICTION_REASON
   * (I-23, pending-decisions)
   */
  codeRestrictionReason: number;
}

// ============================================================================
// 3. יצירת הגבלה חדשה לחניך (POST TraineeRestrictions/CreateTraineeRestriction)
// ============================================================================

export interface CreateTraineeRestrictionRequest extends TraineeRestrictionSaveFields {
  /** מערך מזהי חניכים שעליהם תוטל ההגבלה (במסך חניך בודד: [traineeId]); רשומה לכל חניך (P-12) */
  idntTraineeList: number[];
}

export type CreateTraineeRestrictionResponse = MutationResultDto;

// ============================================================================
// 4. עדכון הגבלה קיימת לחניך (PUT TraineeRestrictions/UpdateTraineeRestriction)
// (מכבה את הרשומה הקודמת LOGI_ACTIVE = 0 ויוצר רשומה חדשה פעילה; החניך נלקח מהרשומה הקודמת ב-DB - T-9)
// ============================================================================

export interface UpdateTraineeRestrictionRequest extends TraineeRestrictionSaveFields {
  /** מזהה הרשומה הקיימת שמוחלפת (IDNT_AVIV_TRAINEE_RESTRICTION). לא קיימת, הוחלפה או הסתיימה → 409 */
  idntPrevious: number;
}

export type UpdateTraineeRestrictionResponse = MutationResultDto;
