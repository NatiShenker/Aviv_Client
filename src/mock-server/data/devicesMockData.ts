import { VIRTUAL_WING_ID, type DeviceDto } from "@/types/organization.schema";

// מכשירי הפנימיות כפי ש-SP_AVIV_GET_DEVICES מחזיר אותם (E-3, E-4): השם "מכשיר {מזהה}, {המיקום המלא}" מורכב בשרת;
// האגף לקיבוץ הוא אגף אמיתי, או האגף הווירטואלי ("מיקומים שונים") למכשירי הפנימייה כולה.
// המזהים 1–8 משמשים את הרשומות שבמוק, ולכן לא משתנים. השאר - כדי שתהיה רשימה ארוכה לבחירה

const DEVICE_NAME_PREFIX = "מכשיר ";
const DEVICE_NAME_SEPARATOR = ", ";

/** מכשיר כפי שהשרת מרכיב אותו: הקידומת, המזהה והמיקום המלא (ספק 00 §6; E-3) */
function buildDevice(idntDevice: number, idntInstitution: number, idntWing: number, fullLocation: string): DeviceDto {
  return {
    idntDevice,
    textDeviceName: `${DEVICE_NAME_PREFIX}${idntDevice}${DEVICE_NAME_SEPARATOR}${fullLocation}`,
    idntWing,
    idntInstitution,
  };
}

export const DEVICES_MOCK_DATA: DeviceDto[] = [
  // פנימיית הדר
  buildDevice(1, 101, 1011, "פנימיית הדר, אגף א, חדר 1"),
  buildDevice(2, 101, 1012, "פנימיית הדר, אגף ב, חדר 3"),
  buildDevice(3, 101, 1013, "פנימיית הדר, אגף ג, פינת טלפון"),
  buildDevice(4, 101, VIRTUAL_WING_ID, "פנימיית הדר, משרד הפנימייה"),
  // פנימיית אורות
  buildDevice(5, 102, 1021, "פנימיית אורות, אגף צפוני, קומה 1"),
  buildDevice(6, 102, 1022, "פנימיית אורות, אגף דרומי, קומה 1"),
  buildDevice(7, 102, VIRTUAL_WING_ID, "פנימיית אורות, משרד הפנימייה"),
  // פנימיית נווה ים
  buildDevice(8, 103, 1031, "פנימיית נווה ים, אגף מרכזי, חדר משותף"),
  // עוד מכשירים, לרשימה ארוכה
  buildDevice(9, 101, 1011, "פנימיית הדר, אגף א, חדר מדריכים"),
  buildDevice(10, 101, 1011, "פנימיית הדר, אגף א, מסדרון"),
  buildDevice(11, 101, 1012, "פנימיית הדר, אגף ב, חדר מדריכים"),
  buildDevice(12, 101, 1012, "פנימיית הדר, אגף ב, מסדרון"),
  buildDevice(13, 101, 1013, "פנימיית הדר, אגף ג, חדר מדריכים"),
  buildDevice(14, 101, VIRTUAL_WING_ID, "פנימיית הדר, מרפאה"),
  buildDevice(15, 101, VIRTUAL_WING_ID, "פנימיית הדר, חדר אוכל"),
  buildDevice(16, 102, 1021, "פנימיית אורות, אגף צפוני, חדר מדריכים"),
  buildDevice(17, 102, 1022, "פנימיית אורות, אגף דרומי, חדר מדריכים"),
];
