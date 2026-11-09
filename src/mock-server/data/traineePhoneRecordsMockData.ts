import type { LookupItem, PermittedCallConditionsDto, PhoneString, TimeString } from "@/types/common.schema";
import type {
  SourceRestrictionSummaryDto,
  TraineePhonePermitRecordDto,
  TraineePhoneRecordDto,
  TraineePhoneRestrictionRecordDto,
} from "@/types/phone-exceptions.schema";
import { daysFromToday } from "../mockDates";
import { DEVICES_MOCK_DATA } from "./devicesMockData";
import { GLOBAL_PHONE_RESTRICTIONS_MOCK_DATA, GLOBAL_RESTRICTION_IDS } from "./globalPhoneRestrictionsMockData";
import { buildAuditMetadata, buildDecisionApproval } from "./recordMetadataBuilders";
import { summarizeGlobalRestriction, summarizeTraineeRestriction } from "./sourceRestrictionBuilders";
import type { StoredRecord } from "./storedRecords";
import {
  SHOWCASE_TRAINEES,
  TRAINEES_MOCK_DATA,
  showcaseEndedRecordCount,
  type TraineeMockRecord,
} from "./traineesMockData";

/*
 * רשומות "הגבלות והיתרים למספר" של החניכים (ספק 04).
 * להגבלות (AVIV_TRAINEE_RESTRICTION_NUMBER) ולהיתרים (AVIV_PERMITS_FOR_RESTRICTION) יש טבלאות נפרדות,
 * ולכן גם רצפי מזהים נפרדים - אותו מזהה יכול להופיע בשניהם.
 *
 * חניך ההדגמה (הראשון בפנימיית הדר) מקבל את התרחישים של ספק 04 overview §8, ועוד רשומות
 * שמכסות את ערכי התצוגה: הגבלה שהסתיימה, הגבלה עתידית עם שעות ומכשירים, והיתר שהסתיים.
 * חניכי התצוגה (הראשונים ברשימה) מקבלים היסטוריה מלאה של הגבלות והיתרים, כולל היתר שגם ההגבלה שלו הסתיימה.
 * שאר החניכים מקבלים פיזור קבוע של הגבלה פעילה או היתר פעיל.
 */

const DEMO_TRAINEE = TRAINEES_MOCK_DATA[0];

/** הגבלה לחניך ההדגמה - בחיפוש היתר מופיעה כ"הגבלה לחניך" (ספק 04 overview §8) */
export const DEMO_TRAINEE_RESTRICTION_PHONE: PhoneString = "0526667788";

interface PermittedHours {
  startTime: TimeString;
  endTime: TimeString;
}

/** תנאי השיחה של רשומה */
interface CallTerms {
  /** null = מלא */
  durationMinutes: number | null;
  permittedHours: PermittedHours | null;
  deviceIds: number[];
  /** הפירוט החופשי (TEXT_RESTRICTION_REASON / TEXT_PERMIT_REASON) */
  details: string;
}

const FULL_TERMS: CallTerms = { durationMinutes: null, permittedHours: null, deviceIds: [], details: "" };

interface RecordDates {
  startDaysFromToday: number;
  endDaysFromToday: number;
}

interface RestrictionSeed extends RecordDates {
  trainee: TraineeMockRecord;
  phoneNumber: PhoneString;
  terms: CallTerms;
}

interface PermitSeed extends RecordDates {
  trainee: TraineeMockRecord;
  terms: CallTerms;
}

// ── חניך ההדגמה ──

const DEMO_RESTRICTION_SEEDS: RestrictionSeed[] = [
  {
    trainee: DEMO_TRAINEE,
    phoneNumber: DEMO_TRAINEE_RESTRICTION_PHONE,
    startDaysFromToday: -5,
    endDaysFromToday: 40,
    terms: { ...FULL_TERMS, details: "בקשת ההורים." },
  },
  {
    trainee: DEMO_TRAINEE,
    phoneNumber: "0541112233",
    startDaysFromToday: -60,
    endDaysFromToday: -20,
    terms: { ...FULL_TERMS, durationMinutes: 10 },
  },
  {
    trainee: DEMO_TRAINEE,
    phoneNumber: "0523334455",
    startDaysFromToday: 3,
    endDaysFromToday: 20,
    terms: {
      durationMinutes: null,
      permittedHours: { startTime: "17:00", endTime: "19:00" },
      deviceIds: [1, 2],
      details: "שיחות רק אחרי שעות הלימודים.",
    },
  },
];

/** היתרים של חניך ההדגמה על הגבלות ארציות, לפי מזהה ההגבלה */
const DEMO_GLOBAL_PERMIT_SEEDS: (PermitSeed & { restrictionId: number })[] = [
  // ספק 04 overview §8: "16:00-19:00 · עד 15 דק׳"
  {
    trainee: DEMO_TRAINEE,
    restrictionId: GLOBAL_RESTRICTION_IDS.demoNational,
    startDaysFromToday: -3,
    endDaysFromToday: 30,
    terms: {
      ...FULL_TERMS,
      durationMinutes: 15,
      permittedHours: { startTime: "16:00", endTime: "19:00" },
      details: "קשר עם בן משפחה.",
    },
  },
  // ספק 04 overview §8: "כל היום · טלפון משרד הפנימייה"
  {
    trainee: DEMO_TRAINEE,
    restrictionId: GLOBAL_RESTRICTION_IDS.demoNationalOnly,
    startDaysFromToday: -1,
    endDaysFromToday: 60,
    terms: { ...FULL_TERMS, deviceIds: [4] },
  },
  {
    trainee: DEMO_TRAINEE,
    restrictionId: GLOBAL_RESTRICTION_IDS.generalNational,
    startDaysFromToday: -50,
    endDaysFromToday: -30,
    terms: FULL_TERMS,
  },
];

/** היתר של חניך ההדגמה על ההגבלה שנוצרה לו (DEMO_TRAINEE_RESTRICTION_PHONE) */
const DEMO_TRAINEE_PERMIT_SEED: PermitSeed = {
  trainee: DEMO_TRAINEE,
  startDaysFromToday: 0,
  endDaysFromToday: 10,
  terms: { ...FULL_TERMS, permittedHours: { startTime: "18:00", endTime: "19:00" }, details: "בקשת ההורים." },
};

// ── פיזור קבוע בין שאר החניכים: מי עם הגבלה פעילה למספר ומי עם היתר פעיל למספר ──

interface Distribution {
  every: number;
  offset: number;
}

const DISTRIBUTION = {
  restriction: { every: 7, offset: 3 },
  permit: { every: 7, offset: 6 },
} satisfies Record<string, Distribution>;

const DISTRIBUTED_RESTRICTION_DAYS: RecordDates = { startDaysFromToday: -3, endDaysFromToday: 30 };
const DISTRIBUTED_PERMIT_DAYS: RecordDates = { startDaysFromToday: -1, endDaysFromToday: 14 };
const DISTRIBUTED_PERMIT_DURATION_MINUTES = 10;

// מספר טלפון ייחודי לכל הגבלה: קידומת קבועה + מיקום החניך
const DISTRIBUTED_PHONE_PREFIX = "0501000";
const DISTRIBUTED_PHONE_SUFFIX_DIGITS = 3;

function matchesDistribution(index: number, { every, offset }: Distribution): boolean {
  return index % every === offset;
}

const OTHER_TRAINEES = TRAINEES_MOCK_DATA.map((trainee, index) => ({ trainee, index })).filter(
  ({ trainee }) => trainee.id !== DEMO_TRAINEE.id,
);

const DISTRIBUTED_RESTRICTION_SEEDS: RestrictionSeed[] = OTHER_TRAINEES.filter(({ index }) =>
  matchesDistribution(index, DISTRIBUTION.restriction),
).map(({ trainee, index }) => ({
  trainee,
  phoneNumber: `${DISTRIBUTED_PHONE_PREFIX}${String(index).padStart(DISTRIBUTED_PHONE_SUFFIX_DIGITS, "0")}`,
  ...DISTRIBUTED_RESTRICTION_DAYS,
  terms: FULL_TERMS,
}));

/** ההגבלה הפנימייתית חלה רק על חניכי הדר; לכל השאר - ההגבלה הארצית */
function distributedPermitRestrictionId(trainee: TraineeMockRecord, index: number): number {
  const isHadarTrainee = trainee.instituteId === DEMO_TRAINEE.instituteId;
  if (isHadarTrainee && index % 2 === 0) {
    return GLOBAL_RESTRICTION_IDS.generalHadar;
  }
  return GLOBAL_RESTRICTION_IDS.generalNational;
}

const DISTRIBUTED_PERMIT_SEEDS: (PermitSeed & { restrictionId: number })[] = OTHER_TRAINEES.filter(({ index }) =>
  matchesDistribution(index, DISTRIBUTION.permit),
).map(({ trainee, index }) => ({
  trainee,
  restrictionId: distributedPermitRestrictionId(trainee, index),
  ...DISTRIBUTED_PERMIT_DAYS,
  terms: { ...FULL_TERMS, durationMinutes: DISTRIBUTED_PERMIT_DURATION_MINUTES },
}));

// ── חניכי התצוגה (הראשונים ברשימה): הגבלות והיתרים פעילים, עתידיים ושהסתיימו ──

const SHOWCASE_TERMS_VARIANTS: CallTerms[] = [
  FULL_TERMS,
  { ...FULL_TERMS, durationMinutes: 15 },
  { ...FULL_TERMS, permittedHours: { startTime: "16:00", endTime: "18:00" } },
  { durationMinutes: 10, permittedHours: null, deviceIds: [1], details: "רק מהטלפון הציבורי באגף." },
];

// מספר ייחודי לכל הגבלה: קידומת + מקום החניך בין חניכי התצוגה + מספר סידורי
const SHOWCASE_PHONE_PREFIX = "05031";
const SHOWCASE_PHONE_ORDER_DIGITS = 4;

// הגבלות שהסתיימו: כל אחת מוקדמת יותר מהקודמת
const SHOWCASE_LATEST_ENDED_DAYS_AGO = 15;
const SHOWCASE_DAYS_BETWEEN_ENDED = 20;
const SHOWCASE_ENDED_LENGTH_DAYS = 7;

// היתרים שהסתיימו על ההגבלה הארצית הכללית (שהתחילה לפני 60 יום) - קצרים, כדי שכולם ייכנסו בתוכה
const SHOWCASE_LATEST_ENDED_PERMIT_DAYS_AGO = 2;
const SHOWCASE_DAYS_BETWEEN_ENDED_PERMITS = 3;
const SHOWCASE_ENDED_PERMIT_LENGTH_DAYS = 1;

function showcasePhone(rank: number, order: number): PhoneString {
  return `${SHOWCASE_PHONE_PREFIX}${rank}${String(order).padStart(SHOWCASE_PHONE_ORDER_DIGITS, "0")}`;
}

function showcaseTerms(order: number): CallTerms {
  return SHOWCASE_TERMS_VARIANTS[order % SHOWCASE_TERMS_VARIANTS.length];
}

function showcaseRestrictionSeeds(trainee: TraineeMockRecord, rank: number): RestrictionSeed[] {
  const endedCount = Math.ceil(showcaseEndedRecordCount(rank) / 2);
  const activeSeed: RestrictionSeed = {
    trainee,
    phoneNumber: showcasePhone(rank, 0),
    startDaysFromToday: -4,
    endDaysFromToday: 25,
    terms: FULL_TERMS,
  };
  const futureSeed: RestrictionSeed = {
    trainee,
    phoneNumber: showcasePhone(rank, 1),
    startDaysFromToday: 6,
    endDaysFromToday: 30,
    terms: showcaseTerms(2),
  };
  const currentSeeds = [activeSeed, futureSeed];
  const endedSeeds = Array.from({ length: endedCount }, (_, order): RestrictionSeed => {
    const endDaysFromToday = -(SHOWCASE_LATEST_ENDED_DAYS_AGO + order * SHOWCASE_DAYS_BETWEEN_ENDED);
    return {
      trainee,
      phoneNumber: showcasePhone(rank, order + currentSeeds.length),
      startDaysFromToday: endDaysFromToday - SHOWCASE_ENDED_LENGTH_DAYS,
      endDaysFromToday,
      terms: showcaseTerms(order),
    };
  });
  return [...currentSeeds, ...endedSeeds];
}

function showcasePermitSeeds(trainee: TraineeMockRecord, rank: number): (PermitSeed & { restrictionId: number })[] {
  const endedCount = Math.floor(showcaseEndedRecordCount(rank) / 2);
  const activeSeed = {
    trainee,
    restrictionId: GLOBAL_RESTRICTION_IDS.generalNational,
    startDaysFromToday: -2,
    endDaysFromToday: 20,
    terms: showcaseTerms(1),
  };
  // היתר שהסתיים על הגבלה שגם היא הסתיימה - "יצירת היתר דומה" לא ימצא הגבלה פעילה למספר
  const endedOnEndedRestrictionSeed = {
    trainee,
    restrictionId: GLOBAL_RESTRICTION_IDS.demoEndedNational,
    startDaysFromToday: -30,
    endDaysFromToday: -20,
    terms: FULL_TERMS,
  };
  const endedSeeds = Array.from({ length: endedCount - 1 }, (_, order) => {
    const endDaysFromToday = -(SHOWCASE_LATEST_ENDED_PERMIT_DAYS_AGO + order * SHOWCASE_DAYS_BETWEEN_ENDED_PERMITS);
    return {
      trainee,
      restrictionId: GLOBAL_RESTRICTION_IDS.generalNational,
      startDaysFromToday: endDaysFromToday - SHOWCASE_ENDED_PERMIT_LENGTH_DAYS,
      endDaysFromToday,
      terms: showcaseTerms(order + 1),
    };
  });
  return [activeSeed, endedOnEndedRestrictionSeed, ...endedSeeds];
}

const SHOWCASE_RESTRICTION_SEEDS = SHOWCASE_TRAINEES.flatMap((trainee, rank) => showcaseRestrictionSeeds(trainee, rank));
const SHOWCASE_PERMIT_SEEDS = SHOWCASE_TRAINEES.flatMap((trainee, rank) => showcasePermitSeeds(trainee, rank));

// ── בניית הרשומות ──

// מזהי טבלת האב (AVIV_RESTRICTION_NUMBER) ומזהי המספרים (AVIV_LIST_PHONE_NUMBER) של הגבלות החניכים
const RESTRICTION_NUMBER_ID_BASE = 6000;
const PHONE_NUMBER_ID_BASE = 7000;
// מזהי קבצי האסמכתא (AVIV_FILE), נפרדים לכל טבלה
const RESTRICTION_FILE_ID_BASE = 5000;
const PERMIT_FILE_ID_BASE = 5500;

function devicesOf(deviceIds: number[]): LookupItem<number>[] {
  return DEVICES_MOCK_DATA.filter((device) => deviceIds.includes(device.id)).map(({ id, name }) => ({ id, name }));
}

function conditionsOf(terms: CallTerms): PermittedCallConditionsDto {
  return {
    numbDurationLimit: terms.durationMinutes,
    timePermitStart: terms.permittedHours?.startTime ?? null,
    timePermitEnd: terms.permittedHours?.endTime ?? null,
    devices: devicesOf(terms.deviceIds),
  };
}

function buildRestrictionRecord(seed: RestrictionSeed, id: number): StoredRecord<TraineePhoneRestrictionRecordDto> {
  const dateStart = daysFromToday(seed.startDaysFromToday);
  const dateEnd = daysFromToday(seed.endDaysFromToday);
  const decision = buildDecisionApproval(RESTRICTION_FILE_ID_BASE + id, seed.terms.details);

  return {
    isPermit: false,
    id,
    idntAvivRestrictionNumber: RESTRICTION_NUMBER_ID_BASE + id,
    idntTrainee: seed.trainee.id,
    idntAvivListPhoneNumber: PHONE_NUMBER_ID_BASE + id,
    textPhoneNumber: seed.phoneNumber,
    dateStart,
    dateEnd,
    sourceRestriction: null,
    ...conditionsOf(seed.terms),
    ...decision,
    ...buildAuditMetadata(dateEnd, seed.startDaysFromToday, decision.approver.id),
    isActive: true,
  };
}

function buildPermitRecord(
  seed: PermitSeed,
  sourceRestriction: SourceRestrictionSummaryDto,
  id: number,
): StoredRecord<TraineePhonePermitRecordDto> {
  const dateStart = daysFromToday(seed.startDaysFromToday);
  const dateEnd = daysFromToday(seed.endDaysFromToday);
  const decision = buildDecisionApproval(PERMIT_FILE_ID_BASE + id, seed.terms.details);

  return {
    isPermit: true,
    id,
    idntAvivRestrictionNumber: sourceRestriction.idntAvivRestrictionNumber,
    idntTrainee: seed.trainee.id,
    // המספר נגזר מההגבלה שעליה חל ההיתר (ספק 04 form §6.1)
    idntAvivListPhoneNumber: sourceRestriction.idntAvivListPhoneNumber,
    textPhoneNumber: sourceRestriction.textPhoneNumber,
    dateStart,
    dateEnd,
    sourceRestriction,
    ...conditionsOf(seed.terms),
    ...decision,
    ...buildAuditMetadata(dateEnd, seed.startDaysFromToday, decision.approver.id),
    isActive: true,
  };
}

function globalRestrictionSummary(restrictionId: number): SourceRestrictionSummaryDto {
  const restriction = GLOBAL_PHONE_RESTRICTIONS_MOCK_DATA.find((candidate) => candidate.id === restrictionId);
  if (!restriction) {
    throw new Error(`Mock data refers to a missing global restriction ${restrictionId}`);
  }
  return summarizeGlobalRestriction(restriction);
}

const RESTRICTION_RECORDS: StoredRecord<TraineePhoneRestrictionRecordDto>[] = [
  ...DEMO_RESTRICTION_SEEDS,
  ...DISTRIBUTED_RESTRICTION_SEEDS,
  ...SHOWCASE_RESTRICTION_SEEDS,
].map((seed, index) => buildRestrictionRecord(seed, index + 1));

// הראשונה ברשימה היא ההגבלה של חניך ההדגמה על DEMO_TRAINEE_RESTRICTION_PHONE
const DEMO_TRAINEE_RESTRICTION = RESTRICTION_RECORDS[0];

const PERMIT_RECORDS: StoredRecord<TraineePhonePermitRecordDto>[] = [
  ...[...DEMO_GLOBAL_PERMIT_SEEDS, ...DISTRIBUTED_PERMIT_SEEDS, ...SHOWCASE_PERMIT_SEEDS].map((seed) => ({
    seed,
    sourceRestriction: globalRestrictionSummary(seed.restrictionId),
  })),
  { seed: DEMO_TRAINEE_PERMIT_SEED, sourceRestriction: summarizeTraineeRestriction(DEMO_TRAINEE_RESTRICTION) },
].map(({ seed, sourceRestriction }, index) => buildPermitRecord(seed, sourceRestriction, index + 1));

export const TRAINEE_PHONE_RECORDS_MOCK_DATA: StoredRecord<TraineePhoneRecordDto>[] = [
  ...RESTRICTION_RECORDS,
  ...PERMIT_RECORDS,
];
