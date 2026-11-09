import type { LookupItem, PhoneString } from "@/types/common.schema";
import { RESTRICTION_SCOPE_CODE, type GlobalPhoneRestrictionRecordDto } from "@/types/phone-exceptions.schema";
import { daysFromToday } from "../mockDates";
import { INSTITUTES_MOCK_DATA } from "./institutesMockData";
import { buildAuditMetadata, buildDecisionApproval } from "./recordMetadataBuilders";
import type { StoredRecord } from "./storedRecords";

/*
 * הגבלות מספר ארציות ופנימייתיות (AVIV_RESTRICTION_NUMBER עם CODE_RESTRICTION_SCOPE כללי), שנוצרו ב"חוסאם".
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

// מזהי AVIV_LIST_PHONE_NUMBER של המספרים
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
  textPhoneNumber: PhoneString;
  /** ריק = ארצית */
  institutes: LookupItem<number>[];
  startDaysFromToday: number;
  endDaysFromToday: number;
  /** הפירוט החופשי של ההגבלה (TEXT_RESTRICTION_REASON) */
  textReason: string;
}

const toInstituteRef = ({ id, name }: LookupItem<number>) => ({ id, name });
const NATIONAL: LookupItem<number>[] = [];

const GLOBAL_RESTRICTION_SEEDS: GlobalRestrictionSeed[] = [
  {
    id: GLOBAL_RESTRICTION_IDS.generalNational,
    textPhoneNumber: GENERAL_NATIONAL_PHONE,
    institutes: NATIONAL,
    startDaysFromToday: -60,
    endDaysFromToday: 300,
    textReason: "חסימה ארצית לפי החלטת ההנהלה.",
  },
  {
    id: GLOBAL_RESTRICTION_IDS.generalHadar,
    textPhoneNumber: GENERAL_INSTITUTE_PHONE,
    institutes: [toInstituteRef(HADAR_INSTITUTE)],
    startDaysFromToday: -30,
    endDaysFromToday: 120,
    textReason: "בקשת הורים.",
  },
  {
    id: GLOBAL_RESTRICTION_IDS.demoNational,
    textPhoneNumber: DEMO_PHONE_NUMBERS.nationalAndInstitute,
    institutes: NATIONAL,
    startDaysFromToday: -20,
    endDaysFromToday: 250,
    textReason: "",
  },
  // מתחילה בעתיד: בבחירה שלה תאריך ההתחלה של ההיתר הוא תחילת ההגבלה, ולא היום (ספק 04 form §4.5)
  {
    id: GLOBAL_RESTRICTION_IDS.demoHadar,
    textPhoneNumber: DEMO_PHONE_NUMBERS.nationalAndInstitute,
    institutes: [toInstituteRef(HADAR_INSTITUTE)],
    startDaysFromToday: 5,
    endDaysFromToday: 100,
    textReason: "בקשת הורים.",
  },
  {
    id: GLOBAL_RESTRICTION_IDS.demoOrot,
    textPhoneNumber: DEMO_PHONE_NUMBERS.nationalAndInstitute,
    institutes: [toInstituteRef(OROT_INSTITUTE)],
    startDaysFromToday: -10,
    endDaysFromToday: 90,
    textReason: "קשר עם גורם טיפולי.",
  },
  {
    id: GLOBAL_RESTRICTION_IDS.demoHadarOnly,
    textPhoneNumber: DEMO_PHONE_NUMBERS.instituteOnly,
    institutes: [toInstituteRef(HADAR_INSTITUTE)],
    startDaysFromToday: -15,
    endDaysFromToday: 60,
    textReason: "",
  },
  {
    id: GLOBAL_RESTRICTION_IDS.demoNationalOnly,
    textPhoneNumber: DEMO_PHONE_NUMBERS.nationalOnly,
    institutes: NATIONAL,
    startDaysFromToday: -100,
    endDaysFromToday: 365,
    textReason: "קשר עם בן משפחה.",
  },
  {
    id: GLOBAL_RESTRICTION_IDS.demoEndedNational,
    textPhoneNumber: DEMO_PHONE_NUMBERS.endedNational,
    institutes: NATIONAL,
    startDaysFromToday: -200,
    endDaysFromToday: -5,
    textReason: "",
  },
];

function buildGlobalRestriction(seed: GlobalRestrictionSeed): StoredRecord<GlobalPhoneRestrictionRecordDto> {
  const dateStart = daysFromToday(seed.startDaysFromToday);
  const dateEnd = daysFromToday(seed.endDaysFromToday);
  const decision = buildDecisionApproval(seed.id, seed.textReason);

  return {
    id: seed.id,
    idntAvivListPhoneNumber: PHONE_NUMBER_IDS[seed.textPhoneNumber],
    textPhoneNumber: seed.textPhoneNumber,
    dateStart,
    dateEnd,
    codeRestrictionScope: RESTRICTION_SCOPE_CODE.general,
    institutes: seed.institutes,
    ...decision,
    ...buildAuditMetadata(dateEnd, seed.startDaysFromToday, decision.approver.id),
    isActive: true,
  };
}

export const GLOBAL_PHONE_RESTRICTIONS_MOCK_DATA: StoredRecord<GlobalPhoneRestrictionRecordDto>[] =
  GLOBAL_RESTRICTION_SEEDS.map(buildGlobalRestriction);
