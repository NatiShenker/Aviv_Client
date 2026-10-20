import type { PhoneString } from "@/types/common.schema";
import type { TraineeVoiceMessageRecordDto } from "@/types/voice-messages.schema";
import { daysFromToday } from "../mockDates";
import { VOICE_MESSAGE_REASONS_MOCK_DATA } from "./reasonsMockData";
import { buildAuditMetadata, buildDecisionApproval } from "./recordMetadataBuilders";
import {
  SHOWCASE_TRAINEES,
  TRAINEES_MOCK_DATA,
  showcaseEndedRecordCount,
  type TraineeMockRecord,
} from "./traineesMockData";

/*
 * ההודעות לנמען של החניכים (ספק 05). כל מספר הוא רשומה נפרדת.
 *
 * חניך ההדגמה (הראשון בפנימיית הדר) מקבל רשומות שמכסות את ערכי התצוגה: כל השיחות ומספר, רגילה וחוזרת,
 * פעילה, עתידית ושהסתיימה, ושני מספרים שנשמרו יחד (אותה החלטה).
 * חניכי התצוגה (הראשונים ברשימה) מקבלים היסטוריה מלאה, כולל הודעות שהסתיימו לבדיקת "צור הודעה חדשה על בסיס זו".
 * שאר החניכים מקבלים פיזור קבוע של הודעה רגילה פעילה או הודעה חוזרת פעילה, כדי שלסינון ברשימת החניכים יהיו התאמות.
 */

const DEMO_TRAINEE = TRAINEES_MOCK_DATA[0];

interface VoiceMessageSeed {
  trainee: TraineeMockRecord;
  /** null = כל השיחות */
  phoneNumber: PhoneString | null;
  repeatDuringCall: boolean;
  startDaysFromToday: number;
  endDaysFromToday: number;
  reason: string;
  details: string;
}

const PARENTS_REQUEST_DETAILS = "ההורים ביקשו לדעת מראש שהשיחה מגיעה מהפנימייה.";

const DEMO_SEEDS: VoiceMessageSeed[] = [
  {
    trainee: DEMO_TRAINEE,
    phoneNumber: null,
    repeatDuringCall: false,
    startDaysFromToday: -2,
    endDaysFromToday: 30,
    reason: "זיהוי מקור השיחה",
    details: "",
  },
  // שני מספרים שנשמרו באותה פעולה - שתי רשומות עם אותה החלטה
  {
    trainee: DEMO_TRAINEE,
    phoneNumber: "0523695424",
    repeatDuringCall: true,
    startDaysFromToday: 0,
    endDaysFromToday: 7,
    reason: "בקשת הורים",
    details: PARENTS_REQUEST_DETAILS,
  },
  {
    trainee: DEMO_TRAINEE,
    phoneNumber: "0541234567",
    repeatDuringCall: true,
    startDaysFromToday: 0,
    endDaysFromToday: 7,
    reason: "בקשת הורים",
    details: PARENTS_REQUEST_DETAILS,
  },
  {
    trainee: DEMO_TRAINEE,
    phoneNumber: "0779876543",
    repeatDuringCall: false,
    startDaysFromToday: 5,
    endDaysFromToday: 12,
    reason: "בקשת גורם טיפולי",
    details: "",
  },
  {
    trainee: DEMO_TRAINEE,
    phoneNumber: "0501112233",
    repeatDuringCall: false,
    startDaysFromToday: -14,
    endDaysFromToday: -10,
    reason: "בקשת גורם טיפולי",
    details: "",
  },
  {
    trainee: DEMO_TRAINEE,
    phoneNumber: null,
    repeatDuringCall: true,
    startDaysFromToday: -40,
    endDaysFromToday: -30,
    reason: "הנחיית הנהלה",
    details: "",
  },
];

// ── פיזור קבוע בין שאר החניכים ──

interface Distribution {
  every: number;
  offset: number;
}

// אותו פיזור שהיה לדגלים הקבועים "הודעה פעילה" ו"הודעה אינטראקטיבית פעילה" ברשימת החניכים
const DISTRIBUTION = {
  regularMessage: { every: 6, offset: 1 },
  repeatingMessage: { every: 10, offset: 3 },
} satisfies Record<string, Distribution>;

const DISTRIBUTED_START_DAYS_FROM_TODAY = -2;
const DISTRIBUTED_END_DAYS_FROM_TODAY = 21;

// מספר טלפון ייחודי לכל הודעה: קידומת קבועה + מיקום החניך
const DISTRIBUTED_PHONE_PREFIX = "0502000";
const DISTRIBUTED_PHONE_SUFFIX_DIGITS = 3;

function matchesDistribution(index: number, { every, offset }: Distribution): boolean {
  return index % every === offset;
}

function reasonFor(index: number): string {
  return VOICE_MESSAGE_REASONS_MOCK_DATA[index % VOICE_MESSAGE_REASONS_MOCK_DATA.length].name;
}

function distributedSeed(
  trainee: TraineeMockRecord,
  index: number,
  overrides: Pick<VoiceMessageSeed, "phoneNumber" | "repeatDuringCall">,
): VoiceMessageSeed {
  return {
    trainee,
    ...overrides,
    startDaysFromToday: DISTRIBUTED_START_DAYS_FROM_TODAY,
    endDaysFromToday: DISTRIBUTED_END_DAYS_FROM_TODAY,
    reason: reasonFor(index),
    details: "",
  };
}

const OTHER_TRAINEES = TRAINEES_MOCK_DATA.map((trainee, index) => ({ trainee, index })).filter(
  ({ trainee }) => trainee.id !== DEMO_TRAINEE.id,
);

// הודעה רגילה לכל השיחות
const DISTRIBUTED_REGULAR_SEEDS: VoiceMessageSeed[] = OTHER_TRAINEES.filter(({ index }) =>
  matchesDistribution(index, DISTRIBUTION.regularMessage),
).map(({ trainee, index }) => distributedSeed(trainee, index, { phoneNumber: null, repeatDuringCall: false }));

// הודעה חוזרת למספר אחד
const DISTRIBUTED_REPEATING_SEEDS: VoiceMessageSeed[] = OTHER_TRAINEES.filter(({ index }) =>
  matchesDistribution(index, DISTRIBUTION.repeatingMessage),
).map(({ trainee, index }) =>
  distributedSeed(trainee, index, {
    phoneNumber: `${DISTRIBUTED_PHONE_PREFIX}${String(index).padStart(DISTRIBUTED_PHONE_SUFFIX_DIGITS, "0")}`,
    repeatDuringCall: true,
  }),
);

// ── חניכי התצוגה (הראשונים ברשימה): הודעות פעילות, עתידית, והיסטוריה מלאה ──

// מספר ייחודי לכל הודעה: קידומת + מקום החניך בין חניכי התצוגה + מספר סידורי
const SHOWCASE_PHONE_PREFIX = "05032";
const SHOWCASE_PHONE_ORDER_DIGITS = 4;

// הודעות שהסתיימו: כל אחת מוקדמת יותר מהקודמת
const SHOWCASE_LATEST_ENDED_DAYS_AGO = 10;
const SHOWCASE_DAYS_BETWEEN_ENDED = 15;
const SHOWCASE_ENDED_LENGTH_DAYS = 7;
// כל הודעה שלישית שהסתיימה הייתה לכל השיחות, וכל הודעה שנייה - חוזרת
const SHOWCASE_ALL_CALLS_EVERY = 3;
const SHOWCASE_REPEATING_EVERY = 2;

function showcasePhone(rank: number, order: number): PhoneString {
  return `${SHOWCASE_PHONE_PREFIX}${rank}${String(order).padStart(SHOWCASE_PHONE_ORDER_DIGITS, "0")}`;
}

function showcaseSeeds(trainee: TraineeMockRecord, rank: number): VoiceMessageSeed[] {
  const currentSeeds: VoiceMessageSeed[] = [
    {
      trainee,
      phoneNumber: null,
      repeatDuringCall: false,
      startDaysFromToday: -2,
      endDaysFromToday: 30,
      reason: reasonFor(rank),
      details: "",
    },
    {
      trainee,
      phoneNumber: showcasePhone(rank, 0),
      repeatDuringCall: true,
      startDaysFromToday: 0,
      endDaysFromToday: 10,
      reason: "בקשת הורים",
      details: PARENTS_REQUEST_DETAILS,
    },
    {
      trainee,
      phoneNumber: showcasePhone(rank, 1),
      repeatDuringCall: false,
      startDaysFromToday: 5,
      endDaysFromToday: 15,
      reason: reasonFor(rank + 1),
      details: "",
    },
  ];

  const endedSeeds = Array.from({ length: showcaseEndedRecordCount(rank) }, (_, order): VoiceMessageSeed => {
    const endDaysFromToday = -(SHOWCASE_LATEST_ENDED_DAYS_AGO + order * SHOWCASE_DAYS_BETWEEN_ENDED);
    const isAllCalls = order % SHOWCASE_ALL_CALLS_EVERY === 0;
    return {
      trainee,
      phoneNumber: isAllCalls ? null : showcasePhone(rank, order + currentSeeds.length),
      repeatDuringCall: order % SHOWCASE_REPEATING_EVERY === 1,
      startDaysFromToday: endDaysFromToday - SHOWCASE_ENDED_LENGTH_DAYS,
      endDaysFromToday,
      reason: reasonFor(order),
      details: "",
    };
  });

  return [...currentSeeds, ...endedSeeds];
}

const SHOWCASE_SEEDS = SHOWCASE_TRAINEES.flatMap((trainee, rank) => showcaseSeeds(trainee, rank));

// ── בניית הרשומות ──

const PHONE_NUMBER_ID_BASE = 7700;
// מזהי קבצי האסמכתא, נפרדים לכל טבלה (ראו approvedFilesMockData)
const FILE_ID_BASE = 8000;

function buildVoiceMessageRecord(seed: VoiceMessageSeed, id: number): TraineeVoiceMessageRecordDto {
  const startDate = daysFromToday(seed.startDaysFromToday);
  const endDate = daysFromToday(seed.endDaysFromToday);
  const decision = buildDecisionApproval(FILE_ID_BASE + id, seed.reason);

  return {
    id,
    traineeId: seed.trainee.id,
    scope: seed.phoneNumber === null ? "all" : "selected",
    phoneNumberId: seed.phoneNumber === null ? null : PHONE_NUMBER_ID_BASE + id,
    phoneNumber: seed.phoneNumber,
    repeatDuringCall: seed.repeatDuringCall,
    startDate,
    endDate,
    ...decision,
    details: seed.details,
    ...buildAuditMetadata(startDate, endDate, seed.startDaysFromToday, decision.approver.id),
  };
}

export const TRAINEE_VOICE_MESSAGES_MOCK_DATA: TraineeVoiceMessageRecordDto[] = [
  ...DEMO_SEEDS,
  ...DISTRIBUTED_REGULAR_SEEDS,
  ...DISTRIBUTED_REPEATING_SEEDS,
  ...SHOWCASE_SEEDS,
].map((seed, index) => buildVoiceMessageRecord(seed, index + 1));
