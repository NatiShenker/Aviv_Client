/**
 * @file organization.schema.ts
 * @description סכמות עבור הקונטרולרים והפרוצדורות הקיימים בשרת (פנימיות, אגפים, מיקומים, הרשאות)
 * ורשימות תומכות (מכשירים וסיבות) שנטענות ברקע.
 * כל הפניות הן לסרביס Aviv_Service, בסגנון Controller/Action.
 */

import type { LookupItem } from "./common.schema.ts";

// ============================================================================
// 1. שליפת פנימיות ואגפים לפי מזהה קליינט (מערך)
// POST Institutions/GetInstitutionsAndWings
// השרת בודק הרשאות ומחזיר רק את הפנימיות שהמשתמש מורשה אליהן
// ============================================================================

export interface GetInstitutesAndWingsRequest {
  /** מערך מזהי קליינט (תומך בסקיילביליות). מאביב נשלח [AVIV_CLIENT_ID] */
  clientIds: number[];
}

export interface WingDto {
  id: number;
  name: string;
  instituteId: number;
  /** האם האגף הוא מיכל וירטואלי (המשמעות העסקית טרם הוגדרה - ראו pending-decisions) */
  isVirtualContainer: boolean;
}

export interface InstituteWithWingsDto {
  id: number;
  name: string;
  clientId: number;
  /** לכל פנימייה יש מערך של אגפים */
  wings: WingDto[];
}

export interface GetInstitutesAndWingsResponse {
  institutes: InstituteWithWingsDto[];
}

// ============================================================================
// 2. שליפת מערך מזהי ההרשאות של המשתמש לפנימייה אחת
// GET Institutions/GetPermissionsForInstitution
// ============================================================================

export interface GetPermissionsForInstituteRequest {
  /** מזהה הפנימייה שנבחרה */
  instituteId: number;
  /** מערך מזהי קליינט. מאביב נשלח [AVIV_CLIENT_ID] */
  clientIds: number[];
}

/** מערך מזהי ההרשאות של המשתמש לאותה פנימייה */
export type GetPermissionsForInstituteResponse = number[];

// ============================================================================
// 3. שליפת המיקומים והמיקומים הווירטואליים לפי מזהי קליינט, פנימייה ואגף (מערכים)
// POST Locations/GetLocationsAndVirtualLocations
// ============================================================================

export interface GetLocationsAndVirtualLocationsRequest {
  clientIds: number[];
  instituteIds: number[];
  wingIds: number[];
}

export interface WingLocationDto {
  id: number;
  name: string;
  wingId: number;
  instituteId: number;
  clientId: number;
  /** האם המיקום וירטואלי (המשמעות העסקית טרם הוגדרה - ראו pending-decisions) */
  isVirtual: boolean;
  /** האם מוצב מכשיר במיקום */
  hasDevice: boolean;
}

export interface GetLocationsAndVirtualLocationsResponse {
  locations: WingLocationDto[];
}

// ============================================================================
// 4. רשימות תומכות הנטענות ברקע (לאחר טעינת רשימת החניכים)
// ============================================================================

export interface GetInstituteDevicesRequest {
  instituteIds: number[];
}

export interface DeviceDto extends LookupItem<number> {
  instituteId: number;
  wingId?: number | null;
}

export interface GetInstituteDevicesResponse {
  devices: DeviceDto[];
}
