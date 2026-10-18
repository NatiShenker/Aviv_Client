import { AVIV_CLIENT_ID } from "@/constants/appConstants";
import type { InstituteWithWingsDto } from "@/schemas/organization.schema";

// פנימייה א' - רשימה ארוכה (בדיקת טעינה הדרגתית), ב' - קצרה, ג' - בלי חניכים (מצב ריק טבעי).
// "מיקומים שונים" הוא אגף וירטואלי: בו נמצאים מכשירי הפנימייה כולה, ואין בו חניכים
export const INSTITUTES_MOCK_DATA: InstituteWithWingsDto[] = [
  {
    id: 101,
    name: "פנימיית הדר",
    clientId: AVIV_CLIENT_ID,
    wings: [
      { id: 1011, name: "א", instituteId: 101, isVirtualContainer: false },
      { id: 1012, name: "ב", instituteId: 101, isVirtualContainer: false },
      { id: 1013, name: "ג", instituteId: 101, isVirtualContainer: false },
      { id: 1019, name: "מיקומים שונים", instituteId: 101, isVirtualContainer: true },
    ],
  },
  {
    id: 102,
    name: "פנימיית אורות",
    clientId: AVIV_CLIENT_ID,
    wings: [
      { id: 1021, name: "צפוני", instituteId: 102, isVirtualContainer: false },
      { id: 1022, name: "דרומי", instituteId: 102, isVirtualContainer: false },
      { id: 1029, name: "מיקומים שונים", instituteId: 102, isVirtualContainer: true },
    ],
  },
  {
    id: 103,
    name: "פנימיית נווה ים",
    clientId: AVIV_CLIENT_ID,
    wings: [{ id: 1031, name: "מרכזי", instituteId: 103, isVirtualContainer: false }],
  },
];
