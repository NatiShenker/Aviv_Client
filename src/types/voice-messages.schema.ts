/**
 * @file voice-messages.schema.ts
 * @description סכמות עבור פעולת "הודעה קולית לנמען": הודעה מזהה שמושמעת לנמען בשיחות היוצאות של החניך.
 *
 * הסכמה משוערת - נוסחה בקליינט לפי ספק 05 וההחלטות עליו, עד שהסרביס יגדיר אותה (ראו pending-decisions).
 * שמות הטבלאות בבסיס הנתונים עדיין לא ידועים. החלקים המשותפים לכל הרשומות (audit, אישור, תוצאת שמירה,
 * תאריכי הרשומה) עוקבים אחרי המוסכמות של הסרביס ב-03/04; השדות של 05 עצמו נשארים כפי שנוסחו.
 *
 * כולל:
 * 1. שליפת ההודעות של חניך.
 * 2. יצירה: הודעה לכל השיחות, או הודעה נפרדת לכל מספר שנבחר.
 * 3. עדכון: ההיקף והמספר נעולים; הרשומה הקודמת נכבית (LOGI_ACTIVE = 0) ונוצרת רשומה פעילה חדשה.
 */

import type {
  ApprovalInput,
  AuditMetadataDto,
  DecisionApprovalDto,
  ISODateString,
  MutationResultDto,
  PhoneString,
} from "./common.schema.ts";

/**
 * היקף ההפעלה של ההודעה:
 * - "all": לפני כל שיחה שהחניך מבצע
 * - "selected": רק בשיחות למספר אחד (כל מספר נשמר כרשומה נפרדת)
 */
export type VoiceMessageScope = "all" | "selected";

// ============================================================================
// 1. שליפת ההודעות של החניך
// ============================================================================

export interface GetTraineeVoiceMessagesRequest {
  /** מערך מזהי חניכים (לסקיילביליות; במסך חניך בודד נשלח [traineeId]) */
  traineeIds: number[];
}

export interface TraineeVoiceMessageRecordDto extends DecisionApprovalDto, AuditMetadataDto {
  id: number;
  traineeId: number;
  scope: VoiceMessageScope;
  /** מזהה המספר בטבלת המספרים (AVIV_LIST_PHONE_NUMBER), כמו ברשומות "הגבלות והיתרים למספר". null כש-scope === "all" */
  phoneNumberId: number | null;
  /** המספר שההודעה מושמעת בשיחות אליו. null כש-scope === "all" */
  phoneNumber: PhoneString | null;
  /**
   * הודעה חוזרת: מושמעת בתחילת השיחה ושוב כל 5 דקות, כל עוד השיחה פעילה (המרווח קבוע).
   * זו "ההודעה האינטראקטיבית" של דגלי רשימת החניכים. false = הודעה רגילה, פעם אחת לפני השיחה
   */
  repeatDuringCall: boolean;
  /** הסיבה מהרשימה הסגורה (שם). שדה של 05 בלבד - ב-03/04 הסיבה עדיין לא נשמרת ולא מוחזרת */
  reason: string;
  dateStart: ISODateString;
  dateEnd: ISODateString;
}

export interface GetTraineeVoiceMessagesResponse {
  records: TraineeVoiceMessageRecordDto[];
}

// ============================================================================
// 2. פרטי ההחלטה בשליחה - הסיבה (שם וקוד) והפירוט כפי שנוסחו ב-05, והאישור המשותף
// ============================================================================

export interface VoiceMessageDecisionInput extends ApprovalInput {
  /** סיבה שנבחרה מרשימה */
  reason: string;
  reasonCode?: number;
  /** פירוט חופשי */
  details: string;
}

// ============================================================================
// 3. יצירת הודעה
// ============================================================================

export interface CreateTraineeVoiceMessageRequest extends VoiceMessageDecisionInput {
  /** מערך מזהי חניכים (במסך חניך בודד: [traineeId]) */
  traineeIds: number[];
  scope: VoiceMessageScope;
  /** "selected": מתפצל בשרת לרשומה נפרדת לכל מספר. "all": מערך ריק [] */
  phoneNumbers: PhoneString[];
  repeatDuringCall: boolean;
  startDate: ISODateString;
  endDate: ISODateString;
}

export type CreateTraineeVoiceMessageResponse = MutationResultDto;

// ============================================================================
// 4. עדכון הודעה קיימת (מכבה את הרשומה הקודמת ויוצר רשומה פעילה חדשה)
// ============================================================================

export interface UpdateTraineeVoiceMessageRequest extends VoiceMessageDecisionInput {
  /** מזהה הרשומה הקודמת שתהפוך ל-LOGI_ACTIVE = 0 */
  previousId: number;
  traineeId: number;
  /** בעריכה ההיקף נעול ולכן נשלח כפי שהוא ברשומה */
  scope: VoiceMessageScope;
  /** בעריכה המספר נעול ולכן נשלח כפי שהוא ברשומה (null בהודעה לכל השיחות) */
  phoneNumber: PhoneString | null;
  repeatDuringCall: boolean;
  startDate: ISODateString;
  endDate: ISODateString;
}

export type UpdateTraineeVoiceMessageResponse = MutationResultDto;
