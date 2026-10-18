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
  // מכאן והלאה - שמות זמניים, הפעולות עדיין לא הוגדרו בסרביס (ראו pending-decisions)
  traineeRestrictions: {
    getTraineeRestrictions: "TraineeRestrictions/GetTraineeRestrictions",
    createTraineeRestriction: "TraineeRestrictions/CreateTraineeRestriction",
    /** PUT: מכבה את הרשומה הקודמת ויוצר רשומה פעילה חדשה */
    updateTraineeRestriction: "TraineeRestrictions/UpdateTraineeRestriction",
  },
  devices: {
    getInstituteDevices: "Devices/GetInstituteDevices",
  },
  lookups: {
    getTraineeRestrictionReasons: "Lookups/GetTraineeRestrictionReasons",
  },
  files: {
    /** רישום קובץ שהועלה ל-SharePoint, כדי לקבל את המזהה שלו (IDNT_APPROVED_FILE) */
    registerApprovedFile: "Files/RegisterApprovedFile",
  },
} as const;
