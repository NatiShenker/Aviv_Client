/**
 * @file trainees.schema.ts
 * @description סכמות עבור שליפת רשימת החניכים בפנימייה (ChildrenList.tsx / ChildDetails.tsx),
 * כולל דגלים בוליאניים נפרדים לכל מצב פעיל, וטיפוסי הסינון והמיון בצד הלקוח.
 * החוזה של TraineesController (service-layer/Models/Trainees), בשמות בסגנון ה-DB (A-7, LC-1).
 * הסינון עצמו נמצא ב-features/trainees-list/traineesListLogic.ts.
 */

import type { ISODateString, LookupItem } from "./common.schema.ts";

// ============================================================================
// 1. בקשת שליפת חניכים לפי פנימיות ו/או אגפים (POST Trainees/GetTrainees)
// חניך נכלל כשהפנימייה שלו ברשימה הראשונה או האגף שלו ברשימה השנייה; לפחות אחת מהרשימות אינה ריקה (L-9)
// ============================================================================

export interface GetTraineesRequest {
  idntInstitutionList: number[];
  /** אגפים. כרגע נשלח ריק, כי סינון האגף מקומי */
  idntWingList: number[];
}

// ============================================================================
// 2. דגלים בוליאניים נפרדים לכל חניך (מחושבים בפרוצדורה עבור תאריך השליפה, I-19)
// ============================================================================

/**
 * כל דגל מייצג האם בתאריך השליפה הנוכחי קיימת לחניך רשומה פעילה (LOGI_ACTIVE = 1 וגם היום בטווח התאריכים).
 * הפרדה לבוליאנים עצמאיים מאפשרת לחניך להחזיק מספר מצבים במקביל (למשל גם הגבלת מספר א' וגם היתר למספר ב').
 */
export interface TraineeActiveStatusFlagsDto {
  // c. הגבלה לחניך (AVIV_TRAINEE_RESTRICTION, L-3)
  /** האם קיימת היום הגבלה מלאה (הרמטית, ללא דקות) פעילה לחניך */
  hasActiveFullRestriction: boolean;
  /** האם קיימת היום הגבלת דקות (NUMB_DURATION_LIMIT) פעילה לחניך */
  hasActiveMinutesRestriction: boolean;

  // d. הודעה לנמען (AVIV_TRAINEE_MESSAGE, L-5)
  /** האם קיימת היום הודעה רגילה פעילה לנמען */
  hasActiveMessage: boolean;
  /** האם קיימת היום הודעה אינטראקטיבית פעילה לנמען ("הודעה חוזרת" - repeatDuringCall ב-voice-messages.schema) */
  hasActiveInteractiveMessage: boolean;

  // e. הגבלות והיתרים למספר (AVIV_TRAINEE_RESTRICTION_NUMBER / PERMITS, L-4)
  /** האם קיימת היום הגבלת מספר של החניך עצמו (היקף חניך בלבד) */
  hasActivePhoneRestriction: boolean;
  /** האם קיים היום היתר פעיל למספר טלפון עבור החניך */
  hasActivePhonePermit: boolean;

  // f. יתרה וסנכרון (מתקבל בשרת מסרביס שלישי - סלקום; עד שהחיבור ייבנה השרת מחזיר false, L-6)
  /** האם קיימת לחניך יתרת דקות (numbRemainingMinutes > 0) */
  hasBalance: boolean;
  /** האם קיים פער בנתונים מול סלקום (להצגת האזהרה בכרטיס החניך) */
  hasCellcomDiscrepancy: boolean;
}

// ============================================================================
// 3. מודל חניך ברשימת החניכים (TraineeListItemDto)
// ============================================================================

export interface TraineeListItemDto {
  /** TRAINEE_SNAPSHOT.IDNT_TRAINEE - המפתח שכל טבלאות AVIV מצביעות עליו */
  idntTrainee: number;
  /** המספר האישי, מספרי. לתצוגה - formatPersonalNumber (features/trainee/traineeDisplay) */
  numbPersonalNumber: number;
  /** שם פרטי ושם משפחה, מורכב בשרת */
  textFullName: string;
  // התמונה מגיעה מ-API חיצוני לפי מזהה החניך (traineePhotosService), ולכן אינה חלק מהרשימה

  idntInstitution: number;
  /** a. אגף (MAIN_WINGS_TABLE) */
  wing: LookupItem<number>;
  /** b. מיקום באגף (A_LOCATION); null כשלחניך אין מיקום */
  location: LookupItem<number> | null;

  /** תאריך סיום ההגבלה הפעילה המאוחרת (להצגת התגית "מוגבל עד DD/MM" בכרטיס החניך); null כשאין */
  dateRestrictedUntil: ISODateString | null;

  /** יתרת דקות החניך (מתקבלת מהסרביס השלישי; 0 עד שהחיבור ייבנה) */
  numbRemainingMinutes: number;

  /** דגלי הסטטוס הפעילים לסינון */
  flags: TraineeActiveStatusFlagsDto;
}

/** התשובה היא הרשימה עצמה, כמו בשליפות הקיימות בסרביס (L-15); ההיסטוריות של 03/04 נשארו עטופות ב-{ records } */
export type GetTraineesResponse = TraineeListItemDto[];

// ============================================================================
// 3a. תמונת חניך (GET Trainees/GetTraineePhoto - שם זמני, ראו pending-decisions)
// הפעולה מחזירה את קובץ התמונה עצמו; הכתובת נבנית בקליינט ונכנסת ישירות ל-src.
// הוחלט (L-8): הדפדפן פונה ל-API החיצוני ישירות; בסיס הכתובת יוחלף כשתינתן (LQ-4)
// ============================================================================

export interface GetTraineePhotoRequest {
  traineeId: number;
}

// ============================================================================
// 4. טיפוסי סינון ומיון בצד הלקוח (עבור ChildrenList.tsx)
// ============================================================================

/** אפשרויות סינון עבור c. הגבלה לחניך */
export type TraineeRestrictionFilter = "all" | "full" | "minutes" | "none";

/** אפשרויות סינון עבור d. הודעה לנמען */
export type RecipientMessageFilter = "all" | "regular" | "interactive" | "none";

/** אפשרויות סינון עבור e. הגבלות והיתרים למספר */
export type PhoneExceptionFilter = "all" | "restriction" | "permit" | "none";

/** אפשרויות סינון עבור f. יתרה */
export type BalanceFilter = "all" | "has_balance" | "no_balance";

export interface TraineeListFiltersState {
  searchQuery: string;
  wingIds: number[];                  // ריק = כל האגפים
  locationIds: number[];              // ריק = כל המיקומים באגף
  traineeRestriction: TraineeRestrictionFilter;
  recipientMessage: RecipientMessageFilter;
  phoneException: PhoneExceptionFilter;
  balance: BalanceFilter;
}

/** שדות המיון ברשימה (בקליינט). "status" = יש לחניך הגבלה פעילה לחניך, או לא */
export type TraineeSortField = "name" | "status" | "minutes" | "wing" | "location";
