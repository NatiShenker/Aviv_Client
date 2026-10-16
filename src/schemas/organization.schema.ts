/**
 * @file organization.schema.ts
 * @description סכמות עבור הקונטרולרים והפרוצדורות הקיימים בשרת (פנימיות, אגפים, מיקומים, הרשאות)
 * ורשימות תומכות (מכשירים וסיבות) שנטענות ברקע.
 */

import type { LookupItem } from "./common.schema.ts";

// ============================================================================
// 1. שליפת פנימיות ואגפים לפי מזהה קליינט (מערך)
// ============================================================================

export interface GetInstitutesAndWingsRequest {
  /** מערך מזהי קליינט (תומך בסקיילביליות) */
  clientIds: number[];
}

export interface WingDto {
  id: number;
  name: string;
  instituteId: number;
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
// 2. שליפת מערך של מזהי הרשאות לפי מזהה קליינט (מערך) ומזהה פנימייה
// ============================================================================

export interface GetUserPermissionsRequest {
  clientIds: number[];
  /** מערך מזהי פנימיות (לסקיילביליות; במקרה הרגיל נשלח איבר בודד [instituteId]) */
  instituteIds: number[];
}

export interface GetUserPermissionsResponse {
  permissionIds: number[];
}

// ============================================================================
// 3. שליפת מערך של מיקומים באגף לפי מזהי קליינט, פנימייה ואגף (מערכים)
// ============================================================================

export interface GetWingLocationsRequest {
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
}

export interface GetWingLocationsResponse {
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