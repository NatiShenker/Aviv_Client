import type { TraineeRestrictionRecordDto } from "@/schemas/trainee-restrictions.schema";
import { daysFromToday } from "../mockDates";
import { buildAuditMetadata, buildDecisionApproval } from "./recordMetadataBuilders";
import { TRAINEE_RESTRICTION_REASONS_MOCK_DATA } from "./reasonsMockData";
import { TRAINEES_MOCK_DATA } from "./traineesMockData";

interface RestrictionSchedule {
  description: string;
  /** החניכים שמקבלים את הרשומה: אלה שהמיקום שלהם ברשימה מתחלק ב-every עם שארית offset */
  appliesTo: { every: number; offset: number };
  /** null = הגבלה מלאה; מספר = הגבלת משך שיחה בדקות */
  durationMinutes: number | null;
  startDaysFromToday: number;
  endDaysFromToday: number;
}

// פיזור קבוע של רשומות בין החניכים, כדי שכל מצב (פעילה, עתידית, הסתיימה) יופיע ברשימה ובהיסטוריה
const RESTRICTION_SCHEDULES: RestrictionSchedule[] = [
  {
    description: "הגבלה מלאה פעילה",
    appliesTo: { every: 8, offset: 2 },
    durationMinutes: null,
    startDaysFromToday: -5,
    endDaysFromToday: 10,
  },
  {
    description: "הגבלת משך שיחה פעילה",
    appliesTo: { every: 8, offset: 5 },
    durationMinutes: 15,
    startDaysFromToday: -2,
    endDaysFromToday: 20,
  },
  {
    description: "הגבלה עתידית",
    appliesTo: { every: 11, offset: 7 },
    durationMinutes: null,
    startDaysFromToday: 3,
    endDaysFromToday: 10,
  },
  {
    description: "הגבלה שהסתיימה",
    appliesTo: { every: 8, offset: 2 },
    durationMinutes: null,
    startDaysFromToday: -40,
    endDaysFromToday: -30,
  },
];

const RESTRICTION_UID_PREFIX = "TR-";
// הערך של CODE_RESTRICTION טרם הוגדר מול ה-DB; ערך קבוע לדוגמה
const PLACEHOLDER_RESTRICTION_CODE = 1;

interface RestrictionSeed {
  traineeId: number;
  schedule: RestrictionSchedule;
}

function seedsForTrainee(traineeId: number, traineeIndex: number): RestrictionSeed[] {
  return RESTRICTION_SCHEDULES.filter(
    ({ appliesTo }) => traineeIndex % appliesTo.every === appliesTo.offset,
  ).map((schedule) => ({ traineeId, schedule }));
}

function buildRestrictionRecord({ traineeId, schedule }: RestrictionSeed, id: number): TraineeRestrictionRecordDto {
  const startDate = daysFromToday(schedule.startDaysFromToday);
  const endDate = daysFromToday(schedule.endDaysFromToday);
  const reason = TRAINEE_RESTRICTION_REASONS_MOCK_DATA[id % TRAINEE_RESTRICTION_REASONS_MOCK_DATA.length].name;
  const decision = buildDecisionApproval(id, reason);

  return {
    id,
    restrictionUid: `${RESTRICTION_UID_PREFIX}${id}`,
    traineeId,
    restrictionCode: PLACEHOLDER_RESTRICTION_CODE,
    startDate,
    endDate,
    durationMinutes: schedule.durationMinutes,
    startTime: null,
    endTime: null,
    devices: [],
    ...decision,
    ...buildAuditMetadata(startDate, endDate, schedule.startDaysFromToday, decision.approver.id),
  };
}

const RESTRICTION_SEEDS = TRAINEES_MOCK_DATA.flatMap((trainee, index) => seedsForTrainee(trainee.id, index));

export const TRAINEE_RESTRICTIONS_MOCK_DATA: TraineeRestrictionRecordDto[] = RESTRICTION_SEEDS.map(
  (seed, index) => buildRestrictionRecord(seed, index + 1),
);
