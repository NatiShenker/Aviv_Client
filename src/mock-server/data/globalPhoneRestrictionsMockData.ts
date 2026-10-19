import type { LookupItem, PhoneString } from "@/schemas/common.schema";
import type { GlobalPhoneRestrictionRecordDto } from "@/schemas/phone-exceptions.schema";
import { daysFromToday } from "../mockDates";
import { INSTITUTES_MOCK_DATA } from "./institutesMockData";
import { buildAuditMetadata, buildDecisionApproval } from "./recordMetadataBuilders";

/*
 * הגבלות מספר ארציות ופנימייתיות (AVIV_RESTRICTION_NUMBER), שנוצרו ב"חוסאם".
 * עליהן יושבים היתרי המספר של החניכים, והן מופיעות בחיפוש של יצירת היתר.
 *
 * מספרי ההדגמה של ספק 04 overview §8.
 */

const [HADAR_INSTITUTE, OROT_INSTITUTE] = INSTITUTES_MOCK_DATA;

/** מספרי טלפון שמופיעים בהגבלות (ספק 04 overview §8) */
export const DEMO_PHONE_NUMBERS = {
  /** ארצית + הדר (ויש גם אורות, שלא חלה על חניך מהדר) */
  nationalAndInstitute: "0508881122",
  /** רק הדר */
  instituteOnly: "0524443322",
  /** רק ארצית, עם היתר קיים לחניך ההדגמה */
  nationalOnly: "039998877",
  /** ארצית שהסתיימה - 0 תוצאות */
  endedNational: "0549990000",
} as const;

// מספרים נוספים, לפיזור היתרים בין שאר החניכים
const GENERAL_NATIONAL_PHONE = "0721234567";
const GENERAL_INSTITUTE_PHONE = "0739876543";

const PHONE_NUMBER_IDS: Record<PhoneString, number> = {
  [GENERAL_NATIONAL_PHONE]: 8001,
  [GENERAL_INSTITUTE_PHONE]: 8002,
  [DEMO_PHONE_NUMBERS.nationalAndInstitute]: 8003,
  [DEMO_PHONE_NUMBERS.instituteOnly]: 8004,
  [DEMO_PHONE_NUMBERS.nationalOnly]: 8005,
  [DEMO_PHONE_NUMBERS.endedNational]: 8006,
};

/** מזהי ההגבלות, כדי שההיתרים שבמוק יוכלו להפנות אליהן */
export const GLOBAL_RESTRICTION_IDS = {
  generalNational: 9001,
  generalHadar: 9002,
  demoNational: 9003,
  demoHadar: 9004,
  demoOrot: 9005,
  demoHadarOnly: 9006,
  demoNationalOnly: 9007,
  demoEndedNational: 9008,
} as const;

interface GlobalRestrictionSeed {
  id: number;
  phoneNumber: PhoneString;
  /** ריק = ארצית */
  institutes: LookupItem<number>[];
  startDaysFromToday: number;
  endDaysFromToday: number;
  reason: string;
}

const toInstituteRef = ({ id, name }: LookupItem<number>) => ({ id, name });
const NATIONAL: LookupItem<number>[] = [];

const GLOBAL_RESTRICTION_SEEDS: GlobalRestrictionSeed[] = [
  {
    id: GLOBAL_RESTRICTION_IDS.generalNational,
    phoneNumber: GENERAL_NATIONAL_PHONE,
    institutes: NATIONAL,
    startDaysFromToday: -60,
    endDaysFromToday: 300,
    reason: "אחר",
  },
  {
    id: GLOBAL_RESTRICTION_IDS.generalHadar,
    phoneNumber: GENERAL_INSTITUTE_PHONE,
    institutes: [toInstituteRef(HADAR_INSTITUTE)],
    startDaysFromToday: -30,
    endDaysFromToday: 120,
    reason: "בקשת הורים",
  },
  {
    id: GLOBAL_RESTRICTION_IDS.demoNational,
    phoneNumber: DEMO_PHONE_NUMBERS.nationalAndInstitute,
    institutes: NATIONAL,
    startDaysFromToday: -20,
    endDaysFromToday: 250,
    reason: "אחר",
  },
  // מתחילה בעתיד: בבחירה שלה תאריך ההתחלה של ההיתר הוא תחילת ההגבלה, ולא היום (ספק 04 form §4.5)
  {
    id: GLOBAL_RESTRICTION_IDS.demoHadar,
    phoneNumber: DEMO_PHONE_NUMBERS.nationalAndInstitute,
    institutes: [toInstituteRef(HADAR_INSTITUTE)],
    startDaysFromToday: 5,
    endDaysFromToday: 100,
    reason: "בקשת הורים",
  },
  {
    id: GLOBAL_RESTRICTION_IDS.demoOrot,
    phoneNumber: DEMO_PHONE_NUMBERS.nationalAndInstitute,
    institutes: [toInstituteRef(OROT_INSTITUTE)],
    startDaysFromToday: -10,
    endDaysFromToday: 90,
    reason: "קשר עם גורם טיפולי",
  },
  {
    id: GLOBAL_RESTRICTION_IDS.demoHadarOnly,
    phoneNumber: DEMO_PHONE_NUMBERS.instituteOnly,
    institutes: [toInstituteRef(HADAR_INSTITUTE)],
    startDaysFromToday: -15,
    endDaysFromToday: 60,
    reason: "",
  },
  {
    id: GLOBAL_RESTRICTION_IDS.demoNationalOnly,
    phoneNumber: DEMO_PHONE_NUMBERS.nationalOnly,
    institutes: NATIONAL,
    startDaysFromToday: -100,
    endDaysFromToday: 365,
    reason: "קשר עם בן משפחה",
  },
  {
    id: GLOBAL_RESTRICTION_IDS.demoEndedNational,
    phoneNumber: DEMO_PHONE_NUMBERS.endedNational,
    institutes: NATIONAL,
    startDaysFromToday: -200,
    endDaysFromToday: -5,
    reason: "אחר",
  },
];

function buildGlobalRestriction(seed: GlobalRestrictionSeed): GlobalPhoneRestrictionRecordDto {
  const startDate = daysFromToday(seed.startDaysFromToday);
  const endDate = daysFromToday(seed.endDaysFromToday);
  const decision = buildDecisionApproval(seed.id, seed.reason);

  return {
    id: seed.id,
    phoneNumberId: PHONE_NUMBER_IDS[seed.phoneNumber],
    phoneNumber: seed.phoneNumber,
    startDate,
    endDate,
    scope: seed.institutes.length === 0 ? "national" : "institute",
    institutes: seed.institutes,
    ...decision,
    ...buildAuditMetadata(startDate, endDate, seed.startDaysFromToday, decision.approver.id),
  };
}

export const GLOBAL_PHONE_RESTRICTIONS_MOCK_DATA: GlobalPhoneRestrictionRecordDto[] =
  GLOBAL_RESTRICTION_SEEDS.map(buildGlobalRestriction);
