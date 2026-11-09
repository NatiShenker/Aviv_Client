import {
  RESTRICTION_SCOPE_CODE,
  type ExistingPermitDto,
  type GlobalPhoneRestrictionRecordDto,
  type SourceRestrictionSummaryDto,
  type TraineePhoneRestrictionRecordDto,
} from "@/types/phone-exceptions.schema";

/*
 * תקציר "הגבלת המקור" של היתר (SourceRestrictionSummaryDto), כמו שהשרת מרכיב אותו מ-AVIV_RESTRICTION_NUMBER
 * ומ-AVIV_INSTITUTES_RESTRICTION_NUMBER (ספק 04 overview §2.3). קוד ה-scope עובר כמו שהוא (C-9).
 * ההיתרים הקיימים תלויים בחניך, ולכן מתקבלים מבחוץ (ריק כשהתקציר שמור בתוך היתר).
 */

export function summarizeGlobalRestriction(
  restriction: GlobalPhoneRestrictionRecordDto,
  existingTraineePermits: ExistingPermitDto[] = [],
): SourceRestrictionSummaryDto {
  return {
    idntAvivRestrictionNumber: restriction.id,
    idntAvivTraineeRestrictionNumber: null,
    idntAvivListPhoneNumber: restriction.idntAvivListPhoneNumber,
    textPhoneNumber: restriction.textPhoneNumber,
    codeRestrictionScope: restriction.codeRestrictionScope,
    institutes: restriction.institutes,
    dateStart: restriction.dateStart,
    dateEnd: restriction.dateEnd,
    textReason: restriction.textReason,
    existingTraineePermits,
  };
}

/** הגבלת מספר שנוצרה לחניך ב"מבט": האב שלה בטבלת האב, שורת החניך, ו-scope של חניך */
export function summarizeTraineeRestriction(
  restriction: TraineePhoneRestrictionRecordDto,
  existingTraineePermits: ExistingPermitDto[] = [],
): SourceRestrictionSummaryDto {
  return {
    idntAvivRestrictionNumber: restriction.idntAvivRestrictionNumber,
    idntAvivTraineeRestrictionNumber: restriction.id,
    idntAvivListPhoneNumber: restriction.idntAvivListPhoneNumber,
    textPhoneNumber: restriction.textPhoneNumber,
    codeRestrictionScope: RESTRICTION_SCOPE_CODE.trainee,
    institutes: [],
    dateStart: restriction.dateStart,
    dateEnd: restriction.dateEnd,
    textReason: restriction.textReason,
    existingTraineePermits,
  };
}
