/**
 * @file trainees.schema.ts
 * @description סכמות עבור שליפת רשימת החניכים בפנימייה (ChildrenList.tsx / ChildDetails.tsx),
 * כולל דגלים בוליאניים נפרדים לכל מצב פעיל, ולוגיקת הסינון והמיון בצד הלקוח.
 */

import type { ISODateString, LookupItem } from "./common.schema.ts";

// ============================================================================
// 1. בקשת שליפת חניכים לפי פנימייה (מערך פנימיות לסקיילביליות)
// ============================================================================

export interface GetTraineesRequest {
  instituteIds: number[];
}

// ============================================================================
// 2. דגלים בוליאניים נפרדים לכל חניך (מחושבים בשרת/SQL עבור תאריך השליפה)
// ============================================================================

/**
 * כל דגל מייצג האם בתאריך השליפה הנוכחי קיימת לחניך רשומה פעילה (LOGI_ACTIVE = 1 וגם היום בטווח התאריכים).
 * הפרדה לבוליאנים עצמאיים מאפשרת לחניך להחזיק מספר מצבים במקביל (למשל גם הגבלת מספר א' וגם היתר למספר ב').
 */
export interface TraineeActiveStatusFlagsDto {
  // c. הגבלה לחניך (AVIV_TRAINEE_RESTRICTION)
  /** האם קיימת היום הגבלה מלאה (הרמטית, ללא דקות) פעילה לחניך */
  hasActiveFullRestriction: boolean;
  /** האם קיימת היום הגבלת דקות (NUMB_CALL_DURATION) פעילה לחניך */
  hasActiveMinutesRestriction: boolean;

  // d. הודעה לנמען
  /** האם קיימת היום הודעה רגילה פעילה לנמען */
  hasActiveMessage: boolean;
  /** האם קיימת היום הודעה אינטראקטיבית פעילה לנמען */
  hasActiveInteractiveMessage: boolean;

  // e. הגבלה/היתר למספר (AVIV_TRAINEE_RESTRICTION_NUMBER / PERMITS)
  /** האם קיימת היום הגבלה פעילה למספר טלפון עבור החניך */
  hasActivePhoneRestriction: boolean;
  /** האם קיים היום היתר פעיל למספר טלפון עבור החניך */
  hasActivePhonePermit: boolean;

  // f. יתרה וסנכרון (מתקבל בשרת מסרביס שלישי - סלקום)
  /** האם קיימת לחניך יתרת דקות (remainingMinutes > 0) */
  hasBalance: boolean;
  /** האם קיים פער בנתונים מול סלקום (להצגת האזהרה בכרטיס החניך) */
  hasCellcomDiscrepancy: boolean;
}

// ============================================================================
// 3. מודל חניך ברשימת החניכים (TraineeListItemDto)
// ============================================================================

export interface TraineeListItemDto {
  id: number;
  /** מספר ת"ז או קוד חניך המוצג לצד השם (למשל "012453") */
  traineeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  photoUrl?: string | null;

  instituteId: number;
  /** a. אגף */
  wing: LookupItem<number>;
  /** b. מיקום באגף */
  location: LookupItem<number> | null;

  /** תאריך עדכון/שהייה להצגה ולמיון */
  lastActivityDate: ISODateString;
  /** תאריך סיום ההגבלה הפעילה (להצגת התגית "מוגבל עד DD/MM" בכרטיס החניך) */
  restrictedUntilDate?: ISODateString | null;

  /** יתרת דקות החניך (מתקבלת מהסרביס השלישי) */
  remainingMinutes: number;

  /** דגלי הסטטוס הפעילים לסינון */
  flags: TraineeActiveStatusFlagsDto;
}

export interface GetTraineesResponse {
  trainees: TraineeListItemDto[];
}

// ============================================================================
// 4. טיפוסי סינון ומיון בצד הלקוח (עבור ChildrenList.tsx)
// ============================================================================

/** אפשרויות סינון עבור c. הגבלה לחניך */
export type TraineeRestrictionFilter = "all" | "full" | "minutes" | "none";

/** אפשרויות סינון עבור d. הודעה לנמען */
export type RecipientMessageFilter = "all" | "regular" | "interactive" | "none";

/** אפשרויות סינון עבור e. הגבלה/היתר למספר */
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

export type TraineeSortField = "name" | "date" | "minutes" | "wing" | "location";
export type SortDirection = "asc" | "desc";

/**
 * פונקציית עזר מובנית לסינון חניך מול מצב הסינון שנבחר ב-ChildrenList.tsx
 */
export function matchesTraineeFilters(
  trainee: TraineeListItemDto,
  filters: TraineeListFiltersState,
): boolean {
  const { flags } = trainee;

  // 1. חיפוש טקסטואלי (שם או קוד חניך)
  const q = filters.searchQuery.trim();
  if (q && !trainee.fullName.includes(q) && !trainee.traineeCode.includes(q)) {
    return false;
  }

  // 2. סינון אגף ומיקום באגף
  if (filters.wingIds.length > 0 && !filters.wingIds.includes(trainee.wing.id)) {
    return false;
  }
  if (
    filters.locationIds.length > 0 &&
    (!trainee.location || !filters.locationIds.includes(trainee.location.id))
  ) {
    return false;
  }

  // 3. c. סינון לפי הגבלה לחניך
  if (filters.traineeRestriction === "full" && !flags.hasActiveFullRestriction) return false;
  if (filters.traineeRestriction === "minutes" && !flags.hasActiveMinutesRestriction) return false;
  if (
    filters.traineeRestriction === "none" &&
    (flags.hasActiveFullRestriction || flags.hasActiveMinutesRestriction)
  ) {
    return false;
  }

  // 4. d. סינון לפי הודעה לנמען
  if (filters.recipientMessage === "regular" && !flags.hasActiveMessage) return false;
  if (filters.recipientMessage === "interactive" && !flags.hasActiveInteractiveMessage) return false;
  if (
    filters.recipientMessage === "none" &&
    (flags.hasActiveMessage || flags.hasActiveInteractiveMessage)
  ) {
    return false;
  }

  // 5. e. סינון לפי הגבלה/היתר למספר
  if (filters.phoneException === "restriction" && !flags.hasActivePhoneRestriction) return false;
  if (filters.phoneException === "permit" && !flags.hasActivePhonePermit) return false;
  if (
    filters.phoneException === "none" &&
    (flags.hasActivePhoneRestriction || flags.hasActivePhonePermit)
  ) {
    return false;
  }

  // 6. f. סינון לפי יתרה
  if (filters.balance === "has_balance" && !flags.hasBalance) return false;
  if (filters.balance === "no_balance" && flags.hasBalance) return false;

  return true;
}