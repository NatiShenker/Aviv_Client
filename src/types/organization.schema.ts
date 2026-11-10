/**
 * @file organization.schema.ts
 * @description סכמות עבור הקונטרולרים והפרוצדורות הקיימים בשרת (פנימיות, אגפים, מיקומים, הרשאות)
 * ורשימת המכשירים (DevicesController, service-layer/Models/Devices).
 * כל הפניות הן לסרביס Aviv_Service, בסגנון Controller/Action.
 * האגפים והמיקומים בשמות של ה-DTO בסרביס (reference/service: WingResponseDto, UnifiedLocationDto; הותאם 2026-11-10);
 * צורת תשובת הפנימיות וההרשאות עדיין לא אומתה (pending-decisions).
 */

/**
 * האגף הווירטואלי המוסכם בין הסרביס לקליינט: "מיקומים שונים". הסרביס מחזיר אותו לכל פנימייה (isVirtualContainer),
 * ותחתיו מקובצים מיקומים ומכשירים שאינם תחת אגף אמיתי (E-4; SP_AVIV_GET_LOCATIONS)
 */
export const VIRTUAL_WING_ID = 99999;

// ============================================================================
// 1. שליפת פנימיות ואגפים לפי מזהה קליינט (מערך)
// POST Institutions/GetInstitutionsAndWings
// השרת בודק הרשאות ומחזיר רק את הפנימיות שהמשתמש מורשה אליהן
// ============================================================================

export interface GetInstitutesAndWingsRequest {
  /** מערך מזהי קליינט (תומך בסקיילביליות). מאביב נשלח [AVIV_CLIENT_ID] */
  clientIds: number[];
}

/** אגף, כפי ש-WingResponseDto של הסרביס מחזיר אותו */
export interface WingDto {
  wingId: number;
  wingName: string;
  /** מספר האגף בסרביס; הטיפוס משוער מהרפרנס, והקליינט אינו קורא אותו */
  wingNumb: number | null;
  institutionId: number;
  /** האגף הווירטואלי "מיקומים שונים" (VIRTUAL_WING_ID): מכיל את מה שאינו תחת אגף אמיתי; אין בו חניכים */
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

/** מיקום, אמיתי או וירטואלי, כפי ש-UnifiedLocationDto של הסרביס מחזיר אותו */
export interface WingLocationDto {
  locationId: number;
  locationName: string;
  institutionId: number;
  /** האגף לקיבוץ: האגף האמיתי של המיקום, או VIRTUAL_WING_ID למיקום וירטואלי ולמיקום שאינו תחת אגף */
  parentId: number;
  /** מיקום וירטואלי (AVIV_VIRTUAL_WING_DATA), לא מקום פיזי של חניך */
  isVirtual: boolean;
  /** האם מוצב מכשיר פעיל במיקום */
  hasDevice: boolean;
}

/** הרשימה עצמה, כמו ש-LocationsController מחזיר (List<UnifiedLocationDto>; הותאם 2026-11-10) */
export type GetLocationsAndVirtualLocationsResponse = WingLocationDto[];

// ============================================================================
// 4. מכשירי הפנימיות, נטענים ברקע אחרי רשימת החניכים (POST Devices/GetInstituteDevices)
// החוזה של DevicesController (service-layer/Models/Devices), בשמות בסגנון ה-DB (A-7, EC-1)
// ============================================================================

export interface GetInstituteDevicesRequest {
  idntInstitutionList: number[];
  /** אגפים; מכשיר נכלל כשהפנימייה שלו או האגף שלו ברשימה. כרגע נשלח ריק */
  idntWingList: number[];
}

/** מכשיר פעיל אחד (AVIV_DEVICE_DATA) */
export interface DeviceDto {
  idntDevice: number;
  /** "מכשיר {מזהה}, {המיקום המלא}" - מורכב בשרת, המקום היחיד שבו נבנה שם מכשיר (E-3) */
  textDeviceName: string;
  /** האגף לקיבוץ בבורר: אגף אמיתי, או VIRTUAL_WING_ID כשהמיקום אינו תחת אגף (E-4) */
  idntWing: number;
  idntInstitution: number;
}

/** הרשימה עצמה, כמו בשליפות הקיימות בסרביס (E-12) */
export type GetInstituteDevicesResponse = DeviceDto[];
