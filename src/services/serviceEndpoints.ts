/** כתובות הפעולות ב-Aviv_Service, בסגנון Controller/Action */
export const SERVICE_ENDPOINTS = {
  institutions: {
    getInstitutionsAndWings: "Institutions/GetInstitutionsAndWings",
    getPermissionsForInstitution: "Institutions/GetPermissionsForInstitution",
  },
  trainees: {
    // שמות הפעולות זמניים - הפעולות עדיין לא הוגדרו בסרביס (ראו pending-decisions)
    getTrainees: "Trainees/GetTrainees",
    /** מחזירה את קובץ התמונה עצמו, ולכן הכתובת נכנסת ישירות ל-src */
    getTraineePhoto: "Trainees/GetTraineePhoto",
  },
  locations: {
    getLocationsAndVirtualLocations: "Locations/GetLocationsAndVirtualLocations",
  },
} as const;
