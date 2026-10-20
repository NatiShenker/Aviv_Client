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
  phoneExceptions: {
    /** כל הרשומות של החניך: הגבלות והיתרים למספרים (ספק 04 history §6) */
    getTraineePhoneRecords: "PhoneExceptions/GetTraineePhoneRecords",
    /** ההגבלות החלות על מספר עבור החניך, ליצירת היתר (ספק 04 overview §2.7) */
    lookupRestrictionsForPermit: "PhoneExceptions/LookupPhoneRestrictionsForPermit",
    createTraineePhoneRestriction: "PhoneExceptions/CreateTraineePhoneRestriction",
    /** PUT: מכבה את הרשומה הקודמת ויוצר רשומה פעילה חדשה */
    updateTraineePhoneRestriction: "PhoneExceptions/UpdateTraineePhoneRestriction",
    createTraineePhonePermit: "PhoneExceptions/CreateTraineePhonePermit",
    /** PUT: מכבה את ההיתר הקודם ויוצר היתר פעיל חדש */
    updateTraineePhonePermit: "PhoneExceptions/UpdateTraineePhonePermit",
  },
  voiceMessages: {
    /** כל ההודעות לנמען של החניך (ספק 05 history §6) */
    getTraineeVoiceMessages: "VoiceMessages/GetTraineeVoiceMessages",
    createTraineeVoiceMessage: "VoiceMessages/CreateTraineeVoiceMessage",
    /** PUT: מכבה את הרשומה הקודמת ויוצר רשומה פעילה חדשה */
    updateTraineeVoiceMessage: "VoiceMessages/UpdateTraineeVoiceMessage",
  },
  devices: {
    getInstituteDevices: "Devices/GetInstituteDevices",
  },
  lookups: {
    getTraineeRestrictionReasons: "Lookups/GetTraineeRestrictionReasons",
    getPhoneExceptionReasons: "Lookups/GetPhoneExceptionReasons",
    getVoiceMessageReasons: "Lookups/GetVoiceMessageReasons",
  },
  files: {
    /** רישום קובץ שהועלה ל-SharePoint, כדי לקבל את המזהה שלו (IDNT_APPROVED_FILE) */
    registerApprovedFile: "Files/RegisterApprovedFile",
  },
} as const;
