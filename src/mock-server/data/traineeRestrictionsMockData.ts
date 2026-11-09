import type { LookupItem, TimeString } from "@/types/common.schema";
import type { TraineeRestrictionRecordDto } from "@/types/trainee-restrictions.schema";
import { daysFromToday } from "../mockDates";
import { DEVICES_MOCK_DATA } from "./devicesMockData";
import { buildAuditMetadata, buildDecisionApproval } from "./recordMetadataBuilders";
import type { StoredRecord } from "./storedRecords";
import {
  TRAINEES_MOCK_DATA,
  showcaseEndedRecordCount,
  showcaseRankOf,
  type TraineeMockRecord,
} from "./traineesMockData";

interface PermittedHours {
  startTime: TimeString;
  endTime: TimeString;
}

/** תנאי ההגבלה, בלי התאריכים */
interface RestrictionTerms {
  /** null = הגבלה מלאה; מספר = הגבלת משך שיחה בדקות */
  durationMinutes: number | null;
  /** היתר שעות בתוך ההגבלה. null = לא הוגדרו שעות */
  permittedHours: PermittedHours | null;
  /** כמה ממכשירי הפנימייה מותרים. 0 = לא הוגדרו מכשירים */
  permittedDeviceCount: number;
  /** הפירוט החופשי (TEXT_RESTRICTION_REASON) */
  details: string;
}

interface RestrictionDates {
  startDaysFromToday: number;
  endDaysFromToday: number;
}

interface Distribution {
  every: number;
  offset: number;
}

interface CurrentRestrictionSchedule extends RestrictionTerms, RestrictionDates {
  description: string;
  /** החניכים שמקבלים את הרשומה: אלה שהמיקום שלהם ברשימה מתחלק ב-every עם שארית offset */
  appliesTo: Distribution;
}

// ── הגבלות פעילות ועתידיות ──
// הן קובעות את התגית "מוגבל עד" ואת הסינון ברשימת החניכים, ולכן מפוזרות רק על חלק מהחניכים
const CURRENT_RESTRICTION_SCHEDULES: CurrentRestrictionSchedule[] = [
  {
    description: "הגבלה מלאה פעילה",
    appliesTo: { every: 8, offset: 2 },
    durationMinutes: null,
    startDaysFromToday: -5,
    endDaysFromToday: 10,
    permittedHours: null,
    permittedDeviceCount: 0,
    details: "",
  },
  {
    description: "הגבלת משך שיחה פעילה, בשעות אחר הצהריים",
    appliesTo: { every: 8, offset: 5 },
    durationMinutes: 15,
    startDaysFromToday: -2,
    endDaysFromToday: 20,
    permittedHours: { startTime: "16:00", endTime: "18:00" },
    permittedDeviceCount: 0,
    details: "לפי החלטת צוות הטיפול. ייבחן מחדש בסוף התקופה.",
  },
  {
    description: "הגבלה עתידית עם היתר שעות ומכשירים",
    appliesTo: { every: 11, offset: 7 },
    durationMinutes: null,
    startDaysFromToday: 3,
    endDaysFromToday: 10,
    permittedHours: { startTime: "08:00", endTime: "12:00" },
    permittedDeviceCount: 2,
    details: "",
  },
];

// ── הגבלות שהסתיימו: ההיסטוריה של רוב החניכים ──
// כל חניך מקבל וריאציות אחרות לפי המיקום שלו ברשימה, כדי שכל ערך תצוגה יופיע
const ENDED_RESTRICTION_VARIANTS: RestrictionTerms[] = [
  { durationMinutes: null, permittedHours: null, permittedDeviceCount: 0, details: "" },
  {
    durationMinutes: null,
    permittedHours: { startTime: "17:00", endTime: "19:00" },
    permittedDeviceCount: 0,
    details: "",
  },
  {
    durationMinutes: null,
    permittedHours: null,
    permittedDeviceCount: 1,
    details: "שיחות מותרות רק מטלפון משרד הפנימייה.",
  },
  {
    durationMinutes: 10,
    permittedHours: { startTime: "16:00", endTime: "18:00" },
    permittedDeviceCount: 2,
    details: "לפי בקשת ההורים, בתיאום עם רכז החינוך.",
  },
  { durationMinutes: 20, permittedHours: null, permittedDeviceCount: 0, details: "" },
];

// ── חניכי התצוגה (הראשונים ברשימה): הגבלה פעילה ועתידית, והיסטוריה מלאה ──
const SHOWCASE_CURRENT_SCHEDULES: (RestrictionTerms & RestrictionDates)[] = [
  {
    durationMinutes: 10,
    startDaysFromToday: -3,
    endDaysFromToday: 12,
    permittedHours: { startTime: "17:00", endTime: "19:00" },
    permittedDeviceCount: 1,
    details: "הגבלת משך זמנית, עד לשיחת המשוב.",
  },
  {
    durationMinutes: null,
    startDaysFromToday: 14,
    endDaysFromToday: 21,
    permittedHours: null,
    permittedDeviceCount: 0,
    details: "",
  },
];

// כעשירית מהחניכים בלי הגבלות שהסתיימו (חלקם בלי הגבלות בכלל), לבדיקת מצב ריק
const WITHOUT_ENDED_HISTORY: Distribution = { every: 10, offset: 9 };
const MAX_REGULAR_ENDED_COUNT = 4;

// כל הגבלה שהסתיימה מוקדמת יותר מהקודמת, בלי חפיפה ביניהן או עם ההגבלות הפעילות
const LATEST_ENDED_DAYS_AGO = 15;
const DAYS_BETWEEN_ENDED_RESTRICTIONS = 20;
const ENDED_RESTRICTION_LENGTH_DAYS = 7;

function matchesDistribution(index: number, { every, offset }: Distribution): boolean {
  return index % every === offset;
}

function endedRestrictionCount(trainee: TraineeMockRecord, traineeIndex: number): number {
  const showcaseRank = showcaseRankOf(trainee);
  if (showcaseRank !== null) {
    return showcaseEndedRecordCount(showcaseRank);
  }
  if (matchesDistribution(traineeIndex, WITHOUT_ENDED_HISTORY)) {
    return 0;
  }
  return 1 + (traineeIndex % MAX_REGULAR_ENDED_COUNT);
}

/** order 0 = ההגבלה שהסתיימה הכי לאחרונה */
function endedRestrictionDates(order: number): RestrictionDates {
  const endDaysFromToday = -(LATEST_ENDED_DAYS_AGO + order * DAYS_BETWEEN_ENDED_RESTRICTIONS);
  return { startDaysFromToday: endDaysFromToday - ENDED_RESTRICTION_LENGTH_DAYS, endDaysFromToday };
}

// ── בניית הרשומות ──

interface RestrictionSeed {
  trainee: TraineeMockRecord;
  terms: RestrictionTerms;
  dates: RestrictionDates;
}

function seedsForTrainee(trainee: TraineeMockRecord, traineeIndex: number): RestrictionSeed[] {
  const currentSchedules = [
    ...CURRENT_RESTRICTION_SCHEDULES.filter((schedule) => matchesDistribution(traineeIndex, schedule.appliesTo)),
    ...(showcaseRankOf(trainee) !== null ? SHOWCASE_CURRENT_SCHEDULES : []),
  ];
  const currentSeeds = currentSchedules.map((schedule) => ({ trainee, terms: schedule, dates: schedule }));

  const endedSeeds = Array.from({ length: endedRestrictionCount(trainee, traineeIndex) }, (_, order) => ({
    trainee,
    terms: ENDED_RESTRICTION_VARIANTS[(traineeIndex + order) % ENDED_RESTRICTION_VARIANTS.length],
    dates: endedRestrictionDates(order),
  }));

  return [...currentSeeds, ...endedSeeds];
}

function permittedDevices(instituteId: number, count: number): LookupItem<number>[] {
  return DEVICES_MOCK_DATA.filter((device) => device.instituteId === instituteId)
    .slice(0, count)
    .map(({ id, name }) => ({ id, name }));
}

function buildRestrictionRecord(
  { trainee, terms, dates }: RestrictionSeed,
  id: number,
): StoredRecord<TraineeRestrictionRecordDto> {
  const dateStart = daysFromToday(dates.startDaysFromToday);
  const dateEnd = daysFromToday(dates.endDaysFromToday);
  const decision = buildDecisionApproval(id, terms.details);

  return {
    id,
    idntTrainee: trainee.id,
    dateStart,
    dateEnd,
    numbDurationLimit: terms.durationMinutes,
    timePermitStart: terms.permittedHours?.startTime ?? null,
    timePermitEnd: terms.permittedHours?.endTime ?? null,
    devices: permittedDevices(trainee.instituteId, terms.permittedDeviceCount),
    ...decision,
    ...buildAuditMetadata(dateEnd, dates.startDaysFromToday, decision.approver.id),
    isActive: true,
  };
}

const RESTRICTION_SEEDS = TRAINEES_MOCK_DATA.flatMap((trainee, index) => seedsForTrainee(trainee, index));

export const TRAINEE_RESTRICTIONS_MOCK_DATA: StoredRecord<TraineeRestrictionRecordDto>[] = RESTRICTION_SEEDS.map(
  (seed, index) => buildRestrictionRecord(seed, index + 1),
);
