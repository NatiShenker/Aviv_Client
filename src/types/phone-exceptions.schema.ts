/**
 * @file phone-exceptions.schema.ts
 * @description סכמות עבור "הגבלות והיתרים למספר" בקליינט "מבט" (ExceptionForm.tsx)
 * וחסימת מספר גלובלית בקליינט "חוסאם".
 * החוזה של PhoneExceptionsController (service-layer/Models/PhoneExceptions).
 *
 * כולל:
 * 1. שליפת רשומות המספרים של חניך.
 * 2. איתור הגבלות פעילות למספר (ארציות, פנימייתיות ושל החניך) עבור יצירת היתר.
 * 3. אנדפוינטים נפרדים ליצירה/עדכון של "הגבלה למספר" וליצירה/עדכון של "היתר למספר".
 * 4. רשומת ההגבלה הכללית של "חוסאם" (במוק בלבד).
 */

import type {
  ApprovalInput,
  AuditMetadataDto,
  DecisionApprovalDto,
  ISODateString,
  LookupItem,
  MutationResultDto,
  PermittedCallConditionsDto,
  PermittedCallConditionsInput,
  PhoneString,
} from "./common.schema.ts";

/**
 * ערכי DECODE AVIV_RESTRICTION_SCOPE של הגבלת מספר (D-5, D-10):
 * 1 - כללית (ארצית, או מצומצמת לפנימיות דרך institutes), 2 - של חניך.
 * ארצית / פנימייתית הן נגזרת תצוגה בקליינט (C-9)
 */
export const RESTRICTION_SCOPE_CODE = {
  general: 1,
  trainee: 2,
} as const;

// ============================================================================
// 1. מודל תקציר הגבלת מקור (SourceRestrictionSummaryDto)
// משמש גם בתוצאות החיפוש ליצירת היתר (סעיף 3) וגם בתוך רשומת היתר בהיסטוריה
// ============================================================================

/** היתר קיים של החניך על הגבלת מקור, להצגה בכרטיס הבחירה */
export interface ExistingPermitDto extends PermittedCallConditionsDto {
  id: number;
  dateStart: ISODateString;
  dateEnd: ISODateString;
}

export interface SourceRestrictionSummaryDto {
  /** הגבלת המספר ב-AVIV_RESTRICTION_NUMBER: האב של הגבלת חניך, או ההגבלה הכללית */
  idntAvivRestrictionNumber: number;
  /** שורת החניך של הגבלת חניך (AVIV_TRAINEE_RESTRICTION_NUMBER); null להגבלה כללית */
  idntAvivTraineeRestrictionNumber: number | null;
  idntAvivListPhoneNumber: number;
  textPhoneNumber: PhoneString;
  /** DECODE AVIV_RESTRICTION_SCOPE כמו שהוא (RESTRICTION_SCOPE_CODE) */
  codeRestrictionScope: number;
  /** הפנימיות שהגבלה כללית מצומצמת אליהן (AVIV_INSTITUTES_RESTRICTION_NUMBER). ריק = ארצית */
  institutes: LookupItem<number>[];
  dateStart: ISODateString;
  dateEnd: ISODateString;
  /** הפירוט בטקסט חופשי של ההגבלה */
  textReason: string;
  /** ההיתרים של החניך הנוכחי על הגבלה זו שלא הסתיימו. ממולא ב-lookup בלבד; בהיסטוריה ריק */
  existingTraineePermits: ExistingPermitDto[];
}

// ============================================================================
// 2. שליפת רשומות "הגבלות והיתרים למספר" של החניך (POST PhoneExceptions/GetTraineePhoneRecords)
// ============================================================================

export interface GetTraineePhoneRecordsRequest {
  idntTraineeList: number[];
}

/** השדות המשותפים להגבלה ולהיתר ברשימת המספרים של החניך */
interface TraineePhoneRecordBaseDto extends PermittedCallConditionsDto, DecisionApprovalDto, AuditMetadataDto {
  /** הגבלה: שורת החניך (AVIV_TRAINEE_RESTRICTION_NUMBER); היתר: ההיתר (AVIV_PERMITS_FOR_RESTRICTION). idntPrevious של עדכון */
  id: number;
  /** הגבלת המספר (AVIV_RESTRICTION_NUMBER): ההורה של הגבלה, או הגבלת המקור של היתר */
  idntAvivRestrictionNumber: number;
  idntTrainee: number;
  idntAvivListPhoneNumber: number;
  textPhoneNumber: PhoneString;
  dateStart: ISODateString;
  dateEnd: ISODateString;
}

/**
 * רשומת "הגבלה למספר" של החניך (חסימת מספר פתוח, עם או בלי תנאים צמודים).
 * משך, שעות ומכשירים מגיעים משורת התנאים הצמודה (D-2); השרת לא מחזיר את מזהה השורה הזו (C-10)
 */
export interface TraineePhoneRestrictionRecordDto extends TraineePhoneRecordBaseDto {
  isPermit: false;
  sourceRestriction: null;
}

/**
 * רשומת "היתר למספר" של החניך (פתיחת מספר חסום על גבי הגבלת מקור, D-4)
 */
export interface TraineePhonePermitRecordDto extends TraineePhoneRecordBaseDto {
  isPermit: true;
  /** פרטי ההגבלה שעליה יושב ההיתר (ארצית / פנימייתית / חניך), כפי שהיא עכשיו */
  sourceRestriction: SourceRestrictionSummaryDto;
}

/**
 * טיפוס מאוחד (Discriminated Union) לפי הדגל isPermit של הפרוצדורה (I-19), לתצוגה ברשימה ובטופס
 */
export type TraineePhoneRecordDto = TraineePhoneRestrictionRecordDto | TraineePhonePermitRecordDto;

export interface GetTraineePhoneRecordsResponse {
  records: TraineePhoneRecordDto[];
}

// ============================================================================
// 3. איתור הגבלות פעילות למספר בעת יצירת "היתר חדש"
// POST PhoneExceptions/LookupPhoneRestrictionsForPermit
// ============================================================================

export interface LookupPhoneRestrictionsForPermitRequest {
  idntTrainee: number;
  /** פנימיית החניך, לבדיקת ההגבלות הפנימייתיות (B-4) */
  idntInstitution: number;
  /** מערך מספרי טלפון לבדיקה (לסקיילביליות; בחיפוש בודד נשלח [phone]) */
  phoneNumberList: PhoneString[];
}

export interface PhoneLookupResultDto {
  /** המספר אחרי הנרמול בשרת */
  textPhoneNumber: PhoneString;
  /** ההגבלות שלא הסתיימו החלות על החניך למספר זה, ממוינות ארצית → פנימייה → חניך → תאריך התחלה */
  activeRestrictions: SourceRestrictionSummaryDto[];
}

export interface LookupPhoneRestrictionsForPermitResponse {
  /** תוצאה לכל מספר שנשלח, בסדר הבקשה */
  results: PhoneLookupResultDto[];
}

// ============================================================================
// 4. אנדפוינט נפרד א': יצירה ועדכון של "הגבלה למספר" לחניך (מבט)
// POST PhoneExceptions/CreateTraineePhoneRestriction / PUT PhoneExceptions/UpdateTraineePhoneRestriction
// ============================================================================

export interface PhoneRestrictionSaveFields extends PermittedCallConditionsInput, ApprovalInput {
  dateRestrictionStart: ISODateString;
  dateRestrictionEnd: ISODateString;
  /** הפירוט בטקסט חופשי (TEXT_RESTRICTION_REASON) */
  textRestrictionReason: string;
  /** קוד הסיבה מהרשימה הסגורה. מתקבל בשרת ולא נשמר עד שתהיה עמודה CODE_RESTRICTION_REASON (I-23) */
  codeRestrictionReason: number;
}

export interface CreateTraineePhoneRestrictionRequest extends PhoneRestrictionSaveFields {
  /** מערך מזהי חניכים (במסך חניך בודד: [traineeId]) */
  idntTraineeList: number[];
  /** מערך מספרי טלפון לחסימה (מתפצל בשרת לרשומה נפרדת לכל זוג חניך × מספר, P-12) */
  phoneNumberList: PhoneString[];
}

export type CreateTraineePhoneRestrictionResponse = MutationResultDto;

export interface UpdateTraineePhoneRestrictionRequest extends PhoneRestrictionSaveFields {
  /** שורת החניך הקודמת (AVIV_TRAINEE_RESTRICTION_NUMBER); המספר והחניך נלקחים ממנה ב-DB. לא קיימת, הוחלפה או הסתיימה → 409 */
  idntPrevious: number;
}

export type UpdateTraineePhoneRestrictionResponse = MutationResultDto;

// ============================================================================
// 5. אנדפוינט נפרד ב': יצירה ועדכון של "היתר למספר" לחניך (מבט)
// POST PhoneExceptions/CreateTraineePhonePermit / PUT PhoneExceptions/UpdateTraineePhonePermit
// ============================================================================

export interface PhonePermitSaveFields extends PermittedCallConditionsInput, ApprovalInput {
  datePermitStart: ISODateString;
  datePermitEnd: ISODateString;
  /** הפירוט בטקסט חופשי (TEXT_PERMIT_REASON) */
  textPermitReason: string;
  /** קוד הסיבה מהרשימה הסגורה. מתקבל בשרת ולא נשמר עד שתהיה עמודה CODE_PERMIT_REASON (I-23) */
  codePermitReason: number;
}

export interface CreateTraineePhonePermitRequest extends PhonePermitSaveFields {
  /** מערך מזהי חניכים (במסך חניך בודד: [traineeId]) */
  idntTraineeList: number[];
  /** פנימיית החניכים, לבדיקה שהגבלה כללית המצומצמת לפנימיות חלה עליהם (C-6); null מדלג על הבדיקה */
  idntInstitution: number | null;
  /** הגבלת המקור שעליה חל ההיתר (SourceRestrictionSummaryDto.idntAvivRestrictionNumber). לא פעילה או לא חלה → 409 */
  idntAvivRestrictionNumber: number;
}

export type CreateTraineePhonePermitResponse = MutationResultDto;

export interface UpdateTraineePhonePermitRequest extends PhonePermitSaveFields {
  /** ההיתר הקודם (AVIV_PERMITS_FOR_RESTRICTION); ההגבלה והחניך נלקחים ממנו ב-DB. לא קיים, הוחלף או הסתיים → 409 */
  idntPrevious: number;
}

export type UpdateTraineePhonePermitResponse = MutationResultDto;

// ============================================================================
// 6. חסימת מספר גלובלית / פנימייתית (קליינט "חוסאם") - שורת AVIV_RESTRICTION_NUMBER עם scope כללי
// הפעולות עליה שייכות לקליינט "חוסאם" ולא מוגדרות באביב; הרשומה משמשת את המוק כהגבלת מקור להיתרים
// ============================================================================

export interface GlobalPhoneRestrictionRecordDto extends DecisionApprovalDto, AuditMetadataDto {
  /** מזהה ב-AVIV_RESTRICTION_NUMBER */
  id: number;
  idntAvivListPhoneNumber: number;
  textPhoneNumber: PhoneString;
  dateStart: ISODateString;
  dateEnd: ISODateString;
  /** תמיד RESTRICTION_SCOPE_CODE.general; ארצית כש-institutes ריק */
  codeRestrictionScope: number;
  /** פנימיות מ-AVIV_INSTITUTES_RESTRICTION_NUMBER (ריק = חסימה ארצית) */
  institutes: LookupItem<number>[];
}
