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
  // הפעולות של TraineeRestrictionsController (service-layer/Controllers)
  traineeRestrictions: {
    getTraineeRestrictions: "TraineeRestrictions/GetTraineeRestrictions",
    createTraineeRestriction: "TraineeRestrictions/CreateTraineeRestriction",
    /** PUT: מכבה את הרשומה הקודמת ויוצר רשומה פעילה חדשה */
    updateTraineeRestriction: "TraineeRestrictions/UpdateTraineeRestriction",
  },
  // הפעולות של PhoneExceptionsController (service-layer/Controllers)
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
  // מכאן והלאה - שמות זמניים, הפעולות עדיין לא הוגדרו בסרביס (ראו pending-decisions); המוק מספק אותן בינתיים
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
  // רשימות הסיבות: בעתיד מטבלאות DECODE לפי CODE_TABLE (ראו pending-decisions)
  lookups: {
    getTraineeRestrictionReasons: "Lookups/GetTraineeRestrictionReasons",
    getPhoneExceptionReasons: "Lookups/GetPhoneExceptionReasons",
    getVoiceMessageReasons: "Lookups/GetVoiceMessageReasons",
  },
} as const;
