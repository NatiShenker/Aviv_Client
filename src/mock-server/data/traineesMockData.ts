import type { LookupItem } from "@/types/common.schema";
import type { InstituteWithWingsDto } from "@/types/organization.schema";
import type { TraineeActiveStatusFlagsDto, TraineeListItemDto } from "@/types/trainees.schema";
import { daysFromToday } from "../mockDates";
import { INSTITUTES_MOCK_DATA } from "./institutesMockData";
import { LOCATIONS_MOCK_DATA } from "./locationsMockData";

/** דגלים שלא נגזרים מרשומות אחרות במוק: יתרה וסלקום (סרביס צד שלישי) */
export type TraineeStaticFlags = Pick<TraineeActiveStatusFlagsDto, "hasBalance" | "hasCellcomDiscrepancy">;

/** חניך כפי שהוא שמור במוק. שאר הדגלים ו-restrictedUntilDate מחושבים ב-handler, כמו בשרת */
export type TraineeMockRecord = Omit<TraineeListItemDto, "flags" | "restrictedUntilDate"> & {
  staticFlags: TraineeStaticFlags;
};

// 16 שמות פרטיים ו-11 שמות משפחה: השילוב לפי האינדקס חוזר רק אחרי 176 חניכים (המכפלה המשותפת הקטנה)
const FIRST_NAMES = [
  "יוסי", "דניאל", "נועה", "מיכל", "איתי", "שירה", "עומר", "תמר",
  "אורי", "יעל", "רון", "הילה", "עידו", "מאיה", "אלון", "נועם",
];
const LAST_NAMES = ["כהן", "לוי", "מזרחי", "פרץ", "ביטון", "אברהם", "פרידמן", "שפירא", "אזולאי", "דהן", "חדד"];

// מספיק חניכים כדי לראות גלילה וטעינה הדרגתית גם במסך דסקטופ רחב
const TRAINEE_COUNT_BY_INSTITUTE: Record<number, number> = {
  101: 150,
  102: 60,
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
  // באגף וירטואלי אין חניכים
  const traineeWings = institute.wings.filter((candidate) => !candidate.isVirtualContainer);
  const wing = traineeWings[index % traineeWings.length];
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

// ── חניכי התצוגה ──

const SHOWCASE_TRAINEE_COUNT = 5;
const HEBREW_LOCALE = "he";
// לראשון: יותר מעמוד אחד (30 כרטיסים), יחד עם הרשומות הפעילות
const SHOWCASE_LONG_HISTORY_COUNT = 34;
const SHOWCASE_REGULAR_HISTORY_COUNT = 10;

/**
 * החניכים הראשונים ברשימה במיון ברירת המחדל (שם, א׳–ת׳) של הפנימייה הראשונה - מה שרואים מיד בכניסה.
 * הם מקבלים היסטוריות מלאות בכל הפעולות; הראשון מביניהם - יותר מעמוד אחד, לבדיקת הטעינה ההדרגתית.
 * המיון יציב, כמו ברשימה, ולכן חניכים עם אותו שם נשארים בסדר המקורי.
 */
export const SHOWCASE_TRAINEES: TraineeMockRecord[] = TRAINEES_MOCK_DATA.filter(
  (trainee) => trainee.instituteId === INSTITUTES_MOCK_DATA[0].id,
)
  .sort((first, second) => first.fullName.localeCompare(second.fullName, HEBREW_LOCALE))
  .slice(0, SHOWCASE_TRAINEE_COUNT);

/** המקום של החניך בין חניכי התצוגה (0 = הראשון ברשימה), או null כשהוא לא אחד מהם */
export function showcaseRankOf(trainee: TraineeMockRecord): number | null {
  const rank = SHOWCASE_TRAINEES.findIndex((showcaseTrainee) => showcaseTrainee.id === trainee.id);
  return rank === -1 ? null : rank;
}

/** כמה רשומות שהסתיימו מקבל חניך תצוגה בכל פעולה: הראשון - יותר מעמוד אחד (30) */
export function showcaseEndedRecordCount(rank: number): number {
  return rank === 0 ? SHOWCASE_LONG_HISTORY_COUNT : SHOWCASE_REGULAR_HISTORY_COUNT;
}
