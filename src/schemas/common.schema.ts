/**
 * @file common.schema.ts
 * @description טיפוסים משותפים, פרימיטיביים ומבני בסיס עבור קליינט "מבט" ו"חוסאם"
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

/** פרטי גורם מאשר (נבחר ב-Client מול MFE חיצוני, נשמר ב-DB כ-IDNT_USER_APPROVAL) */
export interface ApproverRef {
  id: number;
  fullName: string;
  roleTitle?: string;
}

/** פרטי קובץ אסמכתא (מועלה מה-Client ל-SharePoint, נשמר ב-DB כ-IDNT_APPROVED_FILE) */
export interface FileAttachmentRef {
  id: number;
  fileName: string;
  externalUrl?: string;
}

/**
 * סטטוס סנכרון הרשומה מול המרכזייה (נגזר בשרת מהשוואת LAST_REQUEST_UID ל-LAST_SUCCESS_REQUEST_UID)
 */
export type SwitchboardSyncStatus = "synced" | "pending" | "failed";

/**
 * סטטוס מחזור חיים של רשומה פעילה (LOGI_ACTIVE = 1) ביחס לתאריך הנוכחי
 */
export type TemporalStatus = "active" | "scheduled" | "expired";

/**
 * אופי ההגבלה / ההיתר:
 * - "full": חסימה הרמטית (בהגבלה) או פתיחה מלאה ללא הגבלת דקות (בהיתר)
 * - "limited": שיחה מוגבלת למשך דקות מרבי (NUMB_CALL_DURATION)
 */
export type CallLimitKind = "full" | "limited";

/**
 * תנאי היתר לשיחה (משותף להגבלת חניך, להגבלת מספר עם תנאים, ולהיתר למספר)
 * בשליפה (GET) מוחזרים אובייקטי המכשירים המלאים (id + name) לצורך הצגה.
 */
export interface PermittedCallConditionsDto {
  /** משך שיחה מרבי בדקות (1-120). null = ללא הגבלת משך שיחה (או חסימה הרמטית כשאין היתרים) */
  durationMinutes: number | null;
  /** שעת התחלה מותרת לשיחה בכל יום בטווח התאריכים (TIME_PERMIT_START). null = כל היממה */
  startTime: TimeString | null;
  /** שעת סיום מותרת לשיחה בכל יום בטווח התאריכים (TIME_PERMIT_END). null = כל היממה */
  endTime: TimeString | null;
  /** רשימת מכשירים שבהם מותר לחניך לשוחח. מערך ריק [] = מותר בכל מכשירי הפנימייה */
  devices: LookupItem<number>[];
}

/**
 * תנאי היתר לשיחה בעת שליחה לשרת (POST / PUT) - שליחת מזהים בלבד
 */
export interface PermittedCallConditionsInput {
  durationMinutes: number | null;
  startTime: TimeString | null;
  endTime: TimeString | null;
  /** מזהי מכשירים מותרים (IDNT_DEVICE). מערך ריק [] = כל מכשירי הפנימייה */
  deviceIds: number[];
}

/**
 * פרטי החלטה, סיבה ואישור בשליפה מהשרת (GET)
 */
export interface DecisionApprovalDto {
  /** קוד או טקסט הסיבה הראשית שנבחרה מהרשימה */
  reason: string;
  /** פירוט נוסף בטקסט חופשי */
  details: string;
  /** הגורם המאשר (IDNT_USER_APPROVAL + שם מתוך JOIN) */
  approver: ApproverRef;
  /** קובץ האישור שצורף (IDNT_APPROVED_FILE + שם הקובץ) */
  approvedFile: FileAttachmentRef;
}

/**
 * פרטי החלטה, סיבה ואישור בשליחה לשרת (POST / PUT)
 */
export interface DecisionApprovalInput {
  /** סיבה שנבחרה מרשימה (או קוד סיבה CODE_RESTRICTION) */
  reason: string;
  reasonCode?: number;
  /** פירוט חופשי */
  details: string;
  /** מזהה הגורם המאשר שהתקבל מה-MFE השלישי (IDNT_USER_APPROVAL) */
  approverId: number;
  /** מזהה הקובץ שהתקבל מ-SharePoint (IDNT_APPROVED_FILE) */
  approvedFileId: number;
}

/**
 * שדות מעקב ובקרה (Audit) שחוזרים בכל רשומה מהשרת
 */
export interface AuditMetadataDto {
  isActive: boolean;
  temporalStatus: TemporalStatus;
  syncStatus: SwitchboardSyncStatus;
  createdAt: string;
  updatedAt: string | null;
  updatedByUserId: number;
}

/**
 * מעטפת תשובה אחידה לפעולות שמירה/עדכון (POST / PUT)
 * מאחר שכל עדכון יוצר רשומה חדשה ב-DB, השרת תמיד מחזיר את המזהה/ים החדשים שנוצרו.
 */
export interface MutationResultDto<Tecord = unknown> {
  createdIds: number[];
  requestUid: string;
  syncStatus: SwitchboardSyncStatus;
  records?: Tecord[];
}