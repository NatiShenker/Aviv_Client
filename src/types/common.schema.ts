/**
 * @file common.schema.ts
 * @description טיפוסים משותפים, פרימיטיביים ומבני בסיס עבור קליינט "מבט" ו"חוסאם".
 * שמות השדות הם של Aviv_Service: ה-camelCase של ה-DTO בסגנון ה-DB (A-7), כפי שהסרביס מחזיר ומקבל.
 */

/** פורמט תאריך: YYYY-MM-DD */
export type ISODateString = string;

/** פורמט שעה יומית: HH:mm (למשל "16:00") */
export type TimeString = string;

/** מספר טלפון מנורמל (ספרות בלבד, 9-10 ספרות, למשל "0501234567") */
export type PhoneString = string;

/** פריט גנרי של מזהה ושם לתצוגה (עבור JOIN מטבלאות פענוח בשרת) */
export interface LookupItem<TId = number> {
  id: TId;
  name: string;
}

/**
 * הגורם המאשר (IDNT_USER_APPROVAL): נבחר ב-Client מול MFE חיצוני; בשליפה השם מצורף בשרת מטבלת העובדים,
 * וריק כשאין שורה (C-8). התפקיד לא מצורף כרגע
 */
export interface ApproverRef {
  id: number;
  fullName: string;
  roleTitle?: string | null;
}

/** קובץ האישור (AVIV_FILE): textFile הוא הנתיב ב-SharePoint, ו-fileName נגזר ממנו בשרת (D-13) */
export interface ApprovedFileDto {
  id: number;
  fileName: string;
  textFile: string;
}

/** הקובץ שהועלה ל-SharePoint, כפי שהוא נשלח בשמירה (textFile + textFileName) ומוחזק בטופס */
export type ApprovedFileInput = Pick<ApprovedFileDto, "fileName" | "textFile">;

/**
 * אופי ההגבלה / ההיתר:
 * - "full": חסימה הרמטית (בהגבלה) או פתיחה מלאה ללא הגבלת דקות (בהיתר)
 * - "limited": שיחה מוגבלת למשך דקות מרבי (NUMB_DURATION_LIMIT)
 */
export type CallLimitKind = "full" | "limited";

/**
 * תנאי היתר לשיחה (משותף להגבלת חניך, להגבלת מספר עם תנאים, ולהיתר למספר)
 * בשליפה (GET) מוחזרים אובייקטי המכשירים המלאים (id + name) לצורך הצגה.
 */
export interface PermittedCallConditionsDto {
  /** משך שיחה מרבי בדקות (1-120). null = ללא הגבלת משך שיחה (או חסימה הרמטית כשאין היתרים) */
  numbDurationLimit: number | null;
  /** שעת התחלה מותרת לשיחה בכל יום בטווח התאריכים (TIME_PERMIT_START). null = כל היממה */
  timePermitStart: TimeString | null;
  /** שעת סיום מותרת לשיחה בכל יום בטווח התאריכים (TIME_PERMIT_END). null = כל היממה */
  timePermitEnd: TimeString | null;
  /** רשימת מכשירים שבהם מותר לחניך לשוחח. מערך ריק [] = מותר בכל מכשירי הפנימייה */
  devices: LookupItem<number>[];
}

/**
 * תנאי היתר לשיחה בעת שליחה לשרת (POST / PUT) - שליחת מזהים בלבד
 */
export interface PermittedCallConditionsInput {
  numbDurationLimit: number | null;
  timePermitStart: TimeString | null;
  timePermitEnd: TimeString | null;
  /** מזהי מכשירים מותרים (IDNT_DEVICE). מערך ריק [] = כל מכשירי הפנימייה */
  idntDeviceList: number[];
}

/**
 * פרטי ההחלטה והאישור בשליפה מהשרת (GET).
 * הסיבה מהרשימה הסגורה אינה מוחזרת: היא עדיין לא נשמרת ב-DB (I-23, pending-decisions)
 */
export interface DecisionApprovalDto {
  /** הפירוט בטקסט חופשי (TEXT_RESTRICTION_REASON / TEXT_PERMIT_REASON) */
  textReason: string;
  /** הגורם המאשר (IDNT_USER_APPROVAL + שם מתוך JOIN) */
  approver: ApproverRef;
  /** קובץ האישור שצורף (IDNT_APPROVED_FILE → AVIV_FILE) */
  approvedFile: ApprovedFileDto;
}

/**
 * האישור בשליחה לשרת (POST / PUT): הגורם המאשר והקובץ.
 * הפירוט וקוד הסיבה הם שדות של כל בקשה בשמה (textRestrictionReason + codeRestrictionReason / textPermitReason + codePermitReason)
 */
export interface ApprovalInput {
  /** מזהה הגורם המאשר שהתקבל מה-MFE השלישי (IDNT_USER_APPROVAL) */
  idntUserApproval: number;
  /** הנתיב של הקובץ ב-SharePoint; הפרוצדורה מכניסה ממנו את שורת AVIV_FILE (D-13) */
  textFile: string;
  /** שם הקובץ לתצוגה בלבד; הפרוצדורה מקבלת את הנתיב בלבד */
  textFileName: string;
}

/**
 * שדות מעקב ובקרה (Audit) שחוזרים בכל רשומה מהשרת
 */
export interface AuditMetadataDto {
  /** הסתיימה לפי שעון השרת, ברמת יום (I-19). רשומה עתידית אינה "הסתיימה" (OQ-01) */
  isEnded: boolean;
  /** yyyy-MM-ddTHH:mm:ss בזמן השרת, בלי אזור זמן (I-18) */
  dateCreated: string;
  dateUpdated: string | null;
  idntUserUpdate: number;
}

/**
 * מעטפת תשובה אחידה לפעולות שמירה/עדכון (POST / PUT)
 * מאחר שכל עדכון יוצר רשומה חדשה ב-DB, השרת תמיד מחזיר את המזהה/ים החדשים שנוצרו - ורק אותם (A-14, I-20).
 */
export interface MutationResultDto {
  createdIds: number[];
}

/** כיוון מיון ברשימות בצד הלקוח (רשימת החניכים וההיסטוריות) */
export type SortDirection = "asc" | "desc";
