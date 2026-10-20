import type {
  ExistingPermitBriefDto,
  GlobalPhoneRestrictionRecordDto,
  SourceRestrictionSummaryDto,
  TraineePhoneRestrictionRecordDto,
} from "@/types/phone-exceptions.schema";

/*
 * תקציר "הגבלת המקור" של היתר (SourceRestrictionSummaryDto), כמו שהשרת מרכיב אותו ב-JOIN
 * ל-AVIV_RESTRICTION_NUMBER ול-AVIV_INSTITUTES_RESTRICTION_NUMBER (ספק 04 overview §2.3).
 * ההיתרים הקיימים תלויים בחניך, ולכן מתקבלים מבחוץ (ריק כשהתקציר שמור בתוך היתר).
 */

export function summarizeGlobalRestriction(
  restriction: GlobalPhoneRestrictionRecordDto,
  existingTraineePermits: ExistingPermitBriefDto[] = [],
): SourceRestrictionSummaryDto {
  return {
    restrictionId: restriction.id,
    traineeRestrictionNumberId: null,
    phoneNumberId: restriction.phoneNumberId,
    phoneNumber: restriction.phoneNumber,
    scope: restriction.scope,
    institutes: restriction.institutes,
    startDate: restriction.startDate,
    endDate: restriction.endDate,
    reason: restriction.reason,
    existingTraineePermits,
  };
}

/** הגבלת מספר שנוצרה לחניך ב"מבט": המזהה שלה בטבלת האב, והיקף "הגבלה לחניך" */
export function summarizeTraineeRestriction(
  restriction: TraineePhoneRestrictionRecordDto,
  existingTraineePermits: ExistingPermitBriefDto[] = [],
): SourceRestrictionSummaryDto {
  return {
    restrictionId: restriction.restrictionNumberId,
    traineeRestrictionNumberId: restriction.id,
    phoneNumberId: restriction.phoneNumberId,
    phoneNumber: restriction.phoneNumber,
    scope: "trainee",
    institutes: [],
    startDate: restriction.startDate,
    endDate: restriction.endDate,
    reason: restriction.reason,
    existingTraineePermits,
  };
}
