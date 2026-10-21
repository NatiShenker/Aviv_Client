/**
 * @file trainee-restrictions.schema.ts
 * @description סכמות עבור פעולת "הגבלות לחניך" (חסימה נקודתית ללא מספר טלפון)
 * מסך: BlockForm.tsx | טבלה ראשית: AVIV_TRAINEE_RESTRICTION
 */

import type {
  AuditMetadataDto,
  DecisionApprovalDto,
  DecisionApprovalInput,
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
  traineeIds: number[];
}

export interface TraineeRestrictionRecordDto
  extends PermittedCallConditionsDto,
    DecisionApprovalDto,
    AuditMetadataDto {
  /** מזהה הרשומה בטבלת AVIV_TRAINEE_RESTRICTION (IDNT_AVIV_TRAINEE_RESTRICTION) */
  id: number;
  /** מזהה ייחודי לוגי (RESTRICTION_UID) */
  restrictionUid: string;
  /** מזהה החניך (IDNT_TRAINEE) */
  traineeId: number;
  /** קוד ההגבלה ב-DB (CODE_RESTRICTION) */
  restrictionCode: number;
  /** תאריך תחילת ההגבלה (DATE_RESTRICTION_START) */
  startDate: ISODateString;
  /** תאריך סיום ההגבלה (DATE_RESTRICTION_END) */
  endDate: ISODateString;
}

export interface GetTraineeRestrictionsResponse {
  records: TraineeRestrictionRecordDto[];
}

// ============================================================================
// 2. יצירת הגבלה חדשה לחניך (POST TraineeRestrictions/CreateTraineeRestriction)
// ============================================================================

export interface CreateTraineeRestrictionRequest
  extends PermittedCallConditionsInput,
    DecisionApprovalInput {
  /** מערך מזהי חניכים שעליהם תוטל ההגבלה (במסך חניך בודד: [traineeId]) */
  traineeIds: number[];
  startDate: ISODateString;
  endDate: ISODateString;
}

export type CreateTraineeRestrictionResponse = MutationResultDto<TraineeRestrictionRecordDto>;

// ============================================================================
// 3. עדכון הגבלה קיימת לחניך (PUT TraineeRestrictions/UpdateTraineeRestriction)
// (מכבה את הרשומה הקודמת LOGI_ACTIVE = 0 ויוצר רשומה חדשה פעילה)
// ============================================================================

export interface UpdateTraineeRestrictionRequest
  extends PermittedCallConditionsInput,
    DecisionApprovalInput {
  /** מזהה הרשומה הקיימת שמוחלפת (IDNT_AVIV_TRAINEE_RESTRICTION) */
  previousRestrictionId: number;
  traineeId: number;
  startDate: ISODateString;
  endDate: ISODateString;
}

export type UpdateTraineeRestrictionResponse = MutationResultDto<TraineeRestrictionRecordDto>;