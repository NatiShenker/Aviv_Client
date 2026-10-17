import type { LookupItem } from "@/schemas/common.schema";
import type { InstituteWithWingsDto } from "@/schemas/organization.schema";
import type { TraineeActiveStatusFlagsDto, TraineeListItemDto } from "@/schemas/trainees.schema";
import { daysFromToday } from "../mockDates";
import { INSTITUTES_MOCK_DATA } from "./institutesMockData";
import { LOCATIONS_MOCK_DATA } from "./locationsMockData";

/** דגלים שלא נגזרים מרשומות אחרות במוק: הודעות (אין עדיין סכמה), יתרה וסלקום (סרביס צד שלישי) */
export type TraineeStaticFlags = Pick<
  TraineeActiveStatusFlagsDto,
  "hasActiveMessage" | "hasActiveInteractiveMessage" | "hasBalance" | "hasCellcomDiscrepancy"
>;

/** חניך כפי שהוא שמור במוק. שאר הדגלים ו-restrictedUntilDate מחושבים ב-handler, כמו בשרת */
export type TraineeMockRecord = Omit<TraineeListItemDto, "flags" | "restrictedUntilDate"> & {
  staticFlags: TraineeStaticFlags;
};

const FIRST_NAMES = [
  "יוסי", "דניאל", "נועה", "מיכל", "איתי", "שירה", "עומר", "תמר",
  "אורי", "יעל", "רון", "הילה", "עידו", "מאיה", "אלון",
];
const LAST_NAMES = ["כהן", "לוי", "מזרחי", "פרץ", "ביטון", "אברהם", "פרידמן", "שפירא", "אזולאי", "דהן"];

const TRAINEE_COUNT_BY_INSTITUTE: Record<number, number> = {
  101: 75,
  102: 12,
  103: 0,
};

const TRAINEE_ID_BLOCK_PER_INSTITUTE = 1000;
const TRAINEE_CODE_DIGITS = 6;
const REMAINING_MINUTES_STEP = 7;
const MAX_REMAINING_MINUTES = 120;
const LAST_ACTIVITY_WINDOW_DAYS = 30;

// פיזור קבוע של מצבים בין החניכים, כדי שלכל אפשרות סינון יהיו התאמות
interface Distribution {
  every: number;
  offset: number;
}

const STATE_DISTRIBUTION = {
  activeMessage: { every: 6, offset: 1 },
  activeInteractiveMessage: { every: 10, offset: 3 },
  cellcomDiscrepancy: { every: 9, offset: 4 },
  withoutLocation: { every: 5, offset: 0 },
} satisfies Record<string, Distribution>;

function matchesDistribution(index: number, { every, offset }: Distribution): boolean {
  return index % every === offset;
}

function pickLocation(wingId: number, index: number): LookupItem<number> | null {
  if (matchesDistribution(index, STATE_DISTRIBUTION.withoutLocation)) {
    return null;
  }
  const wingLocations = LOCATIONS_MOCK_DATA.filter((location) => location.wingId === wingId);
  if (wingLocations.length === 0) {
    return null;
  }
  const location = wingLocations[index % wingLocations.length];
  return { id: location.id, name: location.name };
}

function buildTrainee(institute: InstituteWithWingsDto, index: number): TraineeMockRecord {
  const id = institute.id * TRAINEE_ID_BLOCK_PER_INSTITUTE + index + 1;
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
  const lastName = LAST_NAMES[index % LAST_NAMES.length];
  const wing = institute.wings[index % institute.wings.length];
  const remainingMinutes = (index * REMAINING_MINUTES_STEP) % MAX_REMAINING_MINUTES;

  return {
    id,
    traineeCode: String(id).padStart(TRAINEE_CODE_DIGITS, "0"),
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    instituteId: institute.id,
    wing: { id: wing.id, name: wing.name },
    location: pickLocation(wing.id, index),
    lastActivityDate: daysFromToday(-(index % LAST_ACTIVITY_WINDOW_DAYS)),
    remainingMinutes,
    staticFlags: {
      hasActiveMessage: matchesDistribution(index, STATE_DISTRIBUTION.activeMessage),
      hasActiveInteractiveMessage: matchesDistribution(index, STATE_DISTRIBUTION.activeInteractiveMessage),
      hasBalance: remainingMinutes > 0,
      hasCellcomDiscrepancy: matchesDistribution(index, STATE_DISTRIBUTION.cellcomDiscrepancy),
    },
  };
}

function buildInstituteTrainees(institute: InstituteWithWingsDto): TraineeMockRecord[] {
  const traineeCount = TRAINEE_COUNT_BY_INSTITUTE[institute.id] ?? 0;
  return Array.from({ length: traineeCount }, (_, index) => buildTrainee(institute, index));
}

export const TRAINEES_MOCK_DATA: TraineeMockRecord[] = INSTITUTES_MOCK_DATA.flatMap(buildInstituteTrainees);
