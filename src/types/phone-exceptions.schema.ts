/**
 * @file phone-exceptions.schema.ts
 * @description סכמות עבור "הגבלות והיתרים למספר" בקליינט "מבט" (ExceptionForm.tsx)
 * וחסימת מספר גלובלית בקליינט "חוסאם".
 *
 * כולל:
 * 1. שליפת רשומות המספרים של חניך (GET).
 * 2. איתור הגבלות פעילות למספר (ארציות, פנימייתיות ושל החניך) עבור יצירת היתר (GET lookup).
 * 3. אנדפוינטים נפרדים ליצירה/עדכון של "הגבלה למספר" (POST/PUT phone-restrictions)
 *    וליצירה/עדכון של "היתר למספר" (POST/PUT phone-permits).
 * 4. סכמות תואמות לקליינט "חוסאם" (Global/Institute Restrictions).
 */

import type {
  AuditMetadataDto,
  DecisionApprovalDto,
  DecisionApprovalInput,
  ISODateString,
  LookupItem,
  MutationResultDto,
  PermittedCallConditionsDto,
  PermittedCallConditionsInput,
  PhoneString,
} from "./common.schema.ts";

/**
 * היקף ההגבלה של מספר טלפון (AVIV_RESTRICTION_NUMBER):
 * - "national": חסימה ארצית לכל הפנימיות (נוצרה ב"חוסאם")
 * - "institute": חסימה לפנימיות מסוימות (נוצרה ב"חוסאם" עם שורות ב-AVIV_INSTITUTES_RESTRICTION_NUMBER)
 * - "trainee": חסימה פרטית לחניך מסוים (נוצרה ב"מבט" עם שורה ב-AVIV_TRAINEE_RESTRICTION_NUMBER)
 */
export type PhoneRestrictionScope = "national" | "institute" | "trainee";

/**
 * סוג הרשומה ברשימת המספרים של החניך ב"מבט"
 */
export type TraineePhoneRecordType = "restriction" | "permit";

// ============================================================================
// 1. מודל תקציר הגבלת מקור (SourceRestrictionRef)
// משמש גם בתוצאות החיפוש ליצירת היתר (סעיף 3a) וגם בתוך כרטיס היתר קיים
// ============================================================================

export interface ExistingPermitBriefDto extends PermittedCallConditionsDto {
  permitId: number;
  startDate: ISODateString;
  endDate: ISODateString;
}

export interface SourceRestrictionSummaryDto {
  /** מזהה ההגבלה ב-AVIV_RESTRICTION_NUMBER (או ב-AVIV_TRAINEE_RESTRICTION_NUMBER) */
  restrictionId: number;
  traineeRestrictionNumberId?: number | null;
  phoneNumberId: number;
  phoneNumber: PhoneString;
  scope: PhoneRestrictionScope;
  /** שמות הפנימיות (כאשר scope === "institute") */
  institutes: LookupItem<number>[];
  startDate: ISODateString;
  endDate: ISODateString;
  reason: string;
  /** היתרים פעילים שכבר קיימים לחניך הנוכחי על הגבלה זו (להצגה בכרטיס הבחירה) */
  existingTraineePermits: ExistingPermitBriefDto[];
}

// ============================================================================
// 2. שליפת רשומות "הגבלות והיתרים למספר" של החניך (POST PhoneExceptions/GetTraineePhoneRecords)
// ============================================================================

export interface GetTraineePhoneRecordsRequest {
  traineeIds: number[];
}

/**
 * רשומת "הגבלה למספר" של החניך (חסימת מספר פתוח, עם או בלי תנאי היתר צמודים)
 */
export interface TraineePhoneRestrictionRecordDto
  extends PermittedCallConditionsDto,
    DecisionApprovalDto,
    AuditMetadataDto {
  type: "restriction";
  /** מזהה ב-AVIV_TRAINEE_RESTRICTION_NUMBER */
  id: number;
  /** מזהה טבלת האב AVIV_RESTRICTION_NUMBER */
  restrictionNumberId: number;
  /** מזהה שורת ה-Permit הצמודה (אם הוגדרו משך שיחה / שעות / מכשירים על ההגבלה) */
  inlinePermitId: number | null;
  traineeId: number;
  phoneNumberId: number;
  phoneNumber: PhoneString;
  startDate: ISODateString;
  endDate: ISODateString;
}

/**
 * רשומת "היתר למספר" של החניך (פתיחת מספר חסום על גבי הגבלת מקור)
 */
export interface TraineePhonePermitRecordDto
  extends PermittedCallConditionsDto,
    DecisionApprovalDto,
    AuditMetadataDto {
  type: "permit";
  /** מזהה ההיתר ב-AVIV_TRAINEE_PERMITS_FOR_RESTRICTION_NUMBER */
  id: number;
  traineeId: number;
  phoneNumberId: number;
  phoneNumber: PhoneString;
  startDate: ISODateString;
  endDate: ISODateString;
  /** פרטי ההגבלה שעליה יושב ההיתר (ארצית / פנימייתית / חניך) */
  sourceRestriction: SourceRestrictionSummaryDto;
}

/**
 * טיפוס מאוחד (Discriminated Union) לתצוגה ברשימה ובטופס ExceptionForm.tsx
 */
export type TraineePhoneRecordDto =
  | TraineePhoneRestrictionRecordDto
  | TraineePhonePermitRecordDto;

export interface GetTraineePhoneRecordsResponse {
  records: TraineePhoneRecordDto[];
}

// ============================================================================
// 3. איתור הגבלות פעילות למספר בעת יצירת "היתר חדש" (סעיף 3a)
// POST PhoneExceptions/LookupPhoneRestrictionsForPermit
// ============================================================================

export interface LookupPhoneRestrictionsForPermitRequest {
  traineeId: number;
  instituteId: number;
  /** מערך מספרי טלפון לבדיקה (לסקיילביליות; בחיפוש בודד נשלח [phone]) */
  phoneNumbers: PhoneString[];
}

export interface PhoneRestrictionsLookupResultItem {
  phoneNumber: PhoneString;
  /** כל ההגבלות הפעילות למספר זה שחלות על החניך (ארציות + פנימייתיות + של החניך עצמו) */
  activeRestrictions: SourceRestrictionSummaryDto[];
}

export interface LookupPhoneRestrictionsForPermitResponse {
  results: PhoneRestrictionsLookupResultItem[];
}

// ============================================================================
// 4. אנדפוינט נפרד א': יצירה ועדכון של "הגבלה למספר" לחניך (מבט)
// POST PhoneExceptions/CreateTraineePhoneRestriction / PUT PhoneExceptions/UpdateTraineePhoneRestriction
// ============================================================================

export interface CreateTraineePhoneRestrictionRequest
  extends PermittedCallConditionsInput,
    DecisionApprovalInput {
  /** מערך מזהי חניכים (במסך חניך בודד: [traineeId]) */
  traineeIds: number[];
  /** מערך מספרי טלפון לחסימה (מתפצל בשרת לרשומות נפרדות עבור כל מספר) */
  phoneNumbers: PhoneString[];
  startDate: ISODateString;
  endDate: ISODateString;
}

export type CreateTraineePhoneRestrictionResponse =
  MutationResultDto<TraineePhoneRestrictionRecordDto>;

export interface UpdateTraineePhoneRestrictionRequest
  extends PermittedCallConditionsInput,
    DecisionApprovalInput {
  /** מזהה רשומת AVIV_TRAINEE_RESTRICTION_NUMBER הקודמת שתהפוך ל-LOGI_ACTIVE = 0 */
  previousId: number;
  traineeId: number;
  /** בעריכה המספר נעול ולכן נשלח מספר בודד (או מערך של איבר אחד) */
  phoneNumber: PhoneString;
  startDate: ISODateString;
  endDate: ISODateString;
}

export type UpdateTraineePhoneRestrictionResponse =
  MutationResultDto<TraineePhoneRestrictionRecordDto>;

// ============================================================================
// 5. אנדפוינט נפרד ב': יצירה ועדכון של "היתר למספר" לחניך (מבט)
// POST PhoneExceptions/CreateTraineePhonePermit / PUT PhoneExceptions/UpdateTraineePhonePermit
// ============================================================================

export interface CreateTraineePhonePermitRequest
  extends PermittedCallConditionsInput,
    DecisionApprovalInput {
  /** מערך מזהי חניכים (במסך חניך בודד: [traineeId]) */
  traineeIds: number[];
  /** מזהה ההגבלה שעליה חל ההיתר (מתוך תוצאות החיפוש SourceRestrictionSummaryDto.restrictionId) */
  sourceRestrictionId: number;
  startDate: ISODateString;
  endDate: ISODateString;
}

export type CreateTraineePhonePermitResponse =
  MutationResultDto<TraineePhonePermitRecordDto>;

export interface UpdateTraineePhonePermitRequest
  extends PermittedCallConditionsInput,
    DecisionApprovalInput {
  /** מזהה ההיתר הקודם ב-AVIV_TRAINEE_PERMITS_FOR_RESTRICTION_NUMBER שיהפוך ל-LOGI_ACTIVE = 0 */
  previousPermitId: number;
  traineeId: number;
  sourceRestrictionId: number;
  startDate: ISODateString;
  endDate: ISODateString;
}

export type UpdateTraineePhonePermitResponse =
  MutationResultDto<TraineePhonePermitRecordDto>;

// ============================================================================
// 6. אנדפוינט ג': חסימת מספר גלובלית / פנימייתית (קליינט "חוסאם")
// הפעולות האלה שייכות לקליינט "חוסאם", ולא מוגדרות באביב
// ============================================================================

export interface GlobalPhoneRestrictionRecordDto
  extends DecisionApprovalDto,
    AuditMetadataDto {
  /** מזהה ב-AVIV_RESTRICTION_NUMBER */
  id: number;
  phoneNumberId: number;
  phoneNumber: PhoneString;
  startDate: ISODateString;
  endDate: ISODateString;
  /** "national" כשמערך הפנימיות ריק, "institute" כשנבחרו פנימיות */
  scope: "national" | "institute";
  /** פנימיות מ-AVIV_INSTITUTES_RESTRICTION_NUMBER (ריק = חסימה ארצית) */
  institutes: LookupItem<number>[];
}

export interface CreateGlobalPhoneRestrictionRequest extends DecisionApprovalInput {
  /** מערך מספרי טלפון לחסימה (מתפצל לרשומות נפרדות ב-DB) */
  phoneNumbers: PhoneString[];
  startDate: ISODateString;
  endDate: ISODateString;
  /** מערך מזהי פנימיות (IDNT_INSTITUTE). מערך ריק [] = חסימה ארצית לכל הפנימיות */
  instituteIds: number[];
}

export interface UpdateGlobalPhoneRestrictionRequest extends DecisionApprovalInput {
  previousRestrictionNumberId: number;
  phoneNumber: PhoneString;
  startDate: ISODateString;
  endDate: ISODateString;
  instituteIds: number[];
}