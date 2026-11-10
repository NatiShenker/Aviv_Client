import { AVIV_CLIENT_ID } from "@/config/appConstants";
import { VIRTUAL_WING_ID, type InstituteWithWingsDto, type WingDto } from "@/types/organization.schema";

// פנימייה א' - רשימה ארוכה (בדיקת טעינה הדרגתית), ב' - קצרה, ג' - בלי חניכים (מצב ריק טבעי).
// "מיקומים שונים" הוא האגף הווירטואלי המוסכם (VIRTUAL_WING_ID), שהסרביס מחזיר לכל פנימייה: בו מכשירי הפנימייה כולה, ואין בו חניכים

function buildWing(wingId: number, wingName: string, institutionId: number): WingDto {
  return { wingId, wingName, wingNumb: null, institutionId, isVirtualContainer: false };
}

function buildVirtualWing(institutionId: number): WingDto {
  return { wingId: VIRTUAL_WING_ID, wingName: "מיקומים שונים", wingNumb: null, institutionId, isVirtualContainer: true };
}

export const INSTITUTES_MOCK_DATA: InstituteWithWingsDto[] = [
  {
    id: 101,
    name: "פנימיית הדר",
    clientId: AVIV_CLIENT_ID,
    wings: [buildWing(1011, "א", 101), buildWing(1012, "ב", 101), buildWing(1013, "ג", 101), buildVirtualWing(101)],
  },
  {
    id: 102,
    name: "פנימיית אורות",
    clientId: AVIV_CLIENT_ID,
    wings: [buildWing(1021, "צפוני", 102), buildWing(1022, "דרומי", 102), buildVirtualWing(102)],
  },
  {
    id: 103,
    name: "פנימיית נווה ים",
    clientId: AVIV_CLIENT_ID,
    wings: [buildWing(1031, "מרכזי", 103), buildVirtualWing(103)],
  },
];
