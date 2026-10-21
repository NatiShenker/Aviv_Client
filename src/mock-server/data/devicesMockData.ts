import type { DeviceDto } from "@/types/organization.schema";

// התוויות הראשונות לפי ספק 00 §6. לכל מכשיר יש אגף; מכשירי הפנימייה כולה - באגף הווירטואלי "מיקומים שונים".
// המזהים 1–8 משמשים את הרשומות שבמוק, ולכן לא משתנים. השאר - כדי שתהיה רשימה ארוכה לבחירה
export const DEVICES_MOCK_DATA: DeviceDto[] = [
  { id: 1, name: "טלפון ציבורי - אגף א", instituteId: 101, wingId: 1011 },
  { id: 2, name: "טלפון ציבורי - אגף ב", instituteId: 101, wingId: 1012 },
  { id: 3, name: "טלפון ציבורי - אגף ג", instituteId: 101, wingId: 1013 },
  { id: 4, name: "טלפון משרד הפנימייה", instituteId: 101, wingId: 1019 },
  { id: 5, name: "טלפון ציבורי - אגף צפוני", instituteId: 102, wingId: 1021 },
  { id: 6, name: "טלפון ציבורי - אגף דרומי", instituteId: 102, wingId: 1022 },
  { id: 7, name: "טלפון משרד הפנימייה", instituteId: 102, wingId: 1029 },
  { id: 8, name: "טלפון ציבורי - אגף מרכזי", instituteId: 103, wingId: 1031 },
  { id: 9, name: "טלפון חדר מדריכים - אגף א", instituteId: 101, wingId: 1011 },
  { id: 10, name: "טלפון מסדרון - אגף א", instituteId: 101, wingId: 1011 },
  { id: 11, name: "טלפון חדר מדריכים - אגף ב", instituteId: 101, wingId: 1012 },
  { id: 12, name: "טלפון מסדרון - אגף ב", instituteId: 101, wingId: 1012 },
  { id: 13, name: "טלפון חדר מדריכים - אגף ג", instituteId: 101, wingId: 1013 },
  { id: 14, name: "טלפון מרפאה", instituteId: 101, wingId: 1019 },
  { id: 15, name: "טלפון מועדון", instituteId: 101, wingId: 1019 },
  { id: 16, name: "טלפון חדר מדריכים - אגף צפוני", instituteId: 102, wingId: 1021 },
  { id: 17, name: "טלפון חדר מדריכים - אגף דרומי", instituteId: 102, wingId: 1022 },
];
