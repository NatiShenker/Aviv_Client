/** כתובות הפעולות ב-Aviv_Service, בסגנון Controller/Action */
export const SERVICE_ENDPOINTS = {
  institutions: {
    getInstitutionsAndWings: "Institutions/GetInstitutionsAndWings",
    getPermissionsForInstitution: "Institutions/GetPermissionsForInstitution",
  },
  trainees: {
    // הפעולה של TraineesController (service-layer/Controllers)
    getTrainees: "Trainees/GetTrainees",
    /**
     * מחזירה את קובץ התמונה עצמו, ולכן הכתובת נכנסת ישירות ל-src. שם זמני: התמונה תגיע מ-API חיצוני ישירות (L-8),
     * ובסיס הכתובת יוחלף כשתינתן (pending-decisions)
     */
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
  // הפעולה של DevicesController (service-layer/Controllers)
  devices: {
    getInstituteDevices: "Devices/GetInstituteDevices",
  },
  // הפעולה של LookupsController (service-layer/Controllers): טבלאות קוד מ-AVIV_DECODE לפי מזהי טבלאות (config/decodeTables)
  lookups: {
    getDecode: "Lookups/GetDecode",
  },
} as const;
