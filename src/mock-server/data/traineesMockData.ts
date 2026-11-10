import type { LookupItem } from "@/types/common.schema";
import type { InstituteWithWingsDto } from "@/types/organization.schema";
import type { TraineeActiveStatusFlagsDto, TraineeListItemDto } from "@/types/trainees.schema";
import { INSTITUTES_MOCK_DATA } from "./institutesMockData";
import { LOCATIONS_MOCK_DATA } from "./locationsMockData";

/** דגלים שלא נגזרים מרשומות אחרות במוק: יתרה וסלקום (סרביס צד שלישי) */
export type TraineeStaticFlags = Pick<TraineeActiveStatusFlagsDto, "hasBalance" | "hasCellcomDiscrepancy">;

/** חניך כפי שהוא שמור במוק. שאר הדגלים ו-dateRestrictedUntil מחושבים ב-handler, כמו בפרוצדורה */
export type TraineeMockRecord = Omit<TraineeListItemDto, "flags" | "dateRestrictedUntil"> & {
  staticFlags: TraineeStaticFlags;
};

// שמות החניכים משתי קבוצות נפרדות - כל שם פרטי עם שם משפחה מאותה קבוצה, כדי שלא ייווצרו צירופים מעורבים.
// אורכי הרשימות זרים זה לזה, ולכן צירוף לפי המספר הסידורי בקבוצה לא חוזר על עצמו בכמות החניכים של המוק.
// החניכים עם שם ערבי ראשונים ברשימה (בקשת המשתמש): במיון ברירת המחדל (שם, א׳ עד ת׳) "מוחמד" הוא השם הפרטי
// הראשון באלף-בית, ואף שם עברי לא קודם לו (העבריים מ"מיכל" והלאה). כך גם חניכי התצוגה, עם ההיסטוריות המלאות,
// הם "מוחמד אבו…"
const HEBREW_NAMES = {
  first: [
    "מיכל", "נועה", "נועם", "נטע", "עומר", "עידו", "עדי", "רון",
    "רותם", "שירה", "שקד", "תמר", "שני", "ספיר", "צליל", "תומר",
  ],
  last: ["כהן", "לוי", "מזרחי", "פרץ", "ביטון", "אברהם", "פרידמן", "שפירא", "אזולאי", "דהן", "חדד"],
};
// "מוחמד" חוזר כמה פעמים, כדי שיהיה השם הנפוץ ברשימה - כמו במציאות. הרבה שמות משפחה, כדי שאותו שם מלא לא יחזור
const ARAB_NAMES = {
  first: ["מוחמד", "סאמר", "מחמוד", "מוחמד", "עלי", "נאסר", "מוחמד", "מוראד", "ראמי", "מוחמד", "מוסא", "סאלח"],
  last: [
    "אבו סאלח", "אבו ראס", "אבו גוש", "חסן", "אבו חמיד", "עבאס", "אבו עמר", "ח׳טיב",
    "אבו ריא", "מסארוה", "אבו כף", "אבו שקרה", "אבו ליל", "אבו עיד", "אבו רביע", "אבו סנינה",
    "אבו ג׳אבר", "אבו זייד", "מחאמיד", "אבו חוסיין", "אבו טועמה", "ג׳בארין", "אבו מוך",
  ],
};
// שניים מכל חמישה חניכים (40%) מקבלים שם ערבי
const NAME_GROUP_SIZE = 5;
const ARAB_NAMES_PER_GROUP = 2;

// מספר אישי: 7 ספרות, לא רציף ובלי אפסים מובילים - כמו מספרים אמיתיים (LQ-3).
// הכפלה במספר זר לטווח (לא מתחלק ב-2, 3 או 5) ושארית החלוקה בטווח הן התאמה חד-חד-ערכית, ולכן אין שני חניכים
// עם אותו מספר. מכפיל גדול מפזר מספרים של חניכים סמוכים על פני כל הטווח
const PERSONAL_NUMBER_MIN = 1000000;
const PERSONAL_NUMBER_RANGE = 9000000;
const PERSONAL_NUMBER_MULTIPLIER = 2654437;

// מספיק חניכים כדי לראות גלילה וטעינה הדרגתית גם במסך דסקטופ רחב
const TRAINEE_COUNT_BY_INSTITUTE: Record<number, number> = {
  101: 150,
  102: 60,
  103: 0,
};

const TRAINEE_ID_BLOCK_PER_INSTITUTE = 1000;
const REMAINING_MINUTES_STEP = 7;
const MAX_REMAINING_MINUTES = 120;

// פיזור קבוע של מצבים בין החניכים, כדי שלכל אפשרות סינון יהיו התאמות
interface Distribution {
  every: number;
  offset: number;
}

const STATE_DISTRIBUTION = {
  cellcomDiscrepancy: { every: 9, offset: 4 },
} satisfies Record<string, Distribution>;

function matchesDistribution(index: number, { every, offset }: Distribution): boolean {
  return index % every === offset;
}

// לכל חניך מיקום ספציפי באגף שלו, כדי שהכרטיס יציג את האגף יחד עם המיקום (בקשת המשתמש, 2026-10-21).
// מיקום וירטואלי אינו מקום שחניך נמצא בו, ולכן לא משובץ. הכרטיס עדיין מטפל בחניך בלי מיקום - הסכמה מאפשרת זאת
function pickLocation(wingId: number, index: number): LookupItem<number> | null {
  const wingLocations = LOCATIONS_MOCK_DATA.filter((location) => location.parentId === wingId && !location.isVirtual);
  if (wingLocations.length === 0) {
    return null;
  }
  const location = wingLocations[index % wingLocations.length];
  return { id: location.locationId, name: location.locationName };
}

/**
 * השם של החניך במקום ה-index: בכל קבוצה של חמישה, השניים הראשונים מקבלים שם ערבי והשאר עברי.
 * בכל קבוצת שמות הצירוף נקבע לפי מספר סידורי משלה (החניך הערבי הראשון, השני…), כדי שהשמות יתפזרו בלי חזרות
 */
function buildTraineeName(index: number): { firstName: string; lastName: string } {
  const groupNumber = Math.floor(index / NAME_GROUP_SIZE);
  const positionInGroup = index % NAME_GROUP_SIZE;
  const hasArabName = positionInGroup < ARAB_NAMES_PER_GROUP;

  const names = hasArabName ? ARAB_NAMES : HEBREW_NAMES;
  const namesPerGroup = hasArabName ? ARAB_NAMES_PER_GROUP : NAME_GROUP_SIZE - ARAB_NAMES_PER_GROUP;
  const positionAmongSameNames = hasArabName ? positionInGroup : positionInGroup - ARAB_NAMES_PER_GROUP;
  const ordinal = groupNumber * namesPerGroup + positionAmongSameNames;

  return {
    firstName: names.first[ordinal % names.first.length],
    lastName: names.last[ordinal % names.last.length],
  };
}

function buildPersonalNumber(idntTrainee: number): number {
  return PERSONAL_NUMBER_MIN + ((idntTrainee * PERSONAL_NUMBER_MULTIPLIER) % PERSONAL_NUMBER_RANGE);
}

function buildTrainee(institute: InstituteWithWingsDto, index: number): TraineeMockRecord {
  const idntTrainee = institute.id * TRAINEE_ID_BLOCK_PER_INSTITUTE + index + 1;
  const { firstName, lastName } = buildTraineeName(index);
  // באגף וירטואלי אין חניכים
  const traineeWings = institute.wings.filter((candidate) => !candidate.isVirtualContainer);
  const wing = traineeWings[index % traineeWings.length];
  const numbRemainingMinutes = (index * REMAINING_MINUTES_STEP) % MAX_REMAINING_MINUTES;

  return {
    idntTrainee,
    numbPersonalNumber: buildPersonalNumber(idntTrainee),
    textFullName: `${firstName} ${lastName}`,
    idntInstitution: institute.id,
    wing: { id: wing.wingId, name: wing.wingName },
    location: pickLocation(wing.wingId, index),
    numbRemainingMinutes,
    staticFlags: {
      hasBalance: numbRemainingMinutes > 0,
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
  (trainee) => trainee.idntInstitution === INSTITUTES_MOCK_DATA[0].id,
)
  .sort((first, second) => first.textFullName.localeCompare(second.textFullName, HEBREW_LOCALE))
  .slice(0, SHOWCASE_TRAINEE_COUNT);

/** המקום של החניך בין חניכי התצוגה (0 = הראשון ברשימה), או null כשהוא לא אחד מהם */
export function showcaseRankOf(trainee: TraineeMockRecord): number | null {
  const rank = SHOWCASE_TRAINEES.findIndex((showcaseTrainee) => showcaseTrainee.idntTrainee === trainee.idntTrainee);
  return rank === -1 ? null : rank;
}

/** כמה רשומות שהסתיימו מקבל חניך תצוגה בכל פעולה: הראשון - יותר מעמוד אחד (30) */
export function showcaseEndedRecordCount(rank: number): number {
  return rank === 0 ? SHOWCASE_LONG_HISTORY_COUNT : SHOWCASE_REGULAR_HISTORY_COUNT;
}
