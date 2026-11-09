import {
  buildDecisionDetailItems,
  buildReasonDetailItem,
  decisionSearchParts,
  type DetailItem,
} from "@/features/records/history/card/recordDetails";
import { sortHistoryRecords, type HistorySortOption } from "@/features/records/history/historySort";
import type { TraineeVoiceMessageRecordDto } from "@/types/voice-messages.schema";
import { formatDateRange } from "@/utils/dates";
import { filterBySearchQuery } from "@/utils/text";
import { VOICE_MESSAGES_TEXTS } from "./voiceMessagesTexts";

const TEXTS = VOICE_MESSAGES_TEXTS;

// ── זיהוי רשומה ──

/** המפתח של הודעה בהיסטוריה: הכרטיס הפתוח וההודעה שנשמרה */
export function voiceMessageRecordKey(record: TraineeVoiceMessageRecordDto): number {
  return record.id;
}

/** ההודעה שהטופס נפתח עליה (בעריכה או ביצירה על בסיס הודעה) */
export function matchesVoiceMessageId(record: TraineeVoiceMessageRecordDto, recordId: number): boolean {
  return record.id === recordId;
}

// ── ערכי התצוגה של רשומה (ספק 05 history §3) ──

const CARD_DOM_ID_PREFIX = "voice-message-card-";

/** מזהה ה-DOM של כרטיס, כדי לגלול אליו אחרי שמירה */
export function voiceMessageCardDomId(recordId: number): string {
  return `${CARD_DOM_ID_PREFIX}${recordId}`;
}

/** הודעה למספר אחד, או לכל השיחות (אז אין מספר) */
export function isAllCallsMessage(record: Pick<TraineeVoiceMessageRecordDto, "phoneNumber">): boolean {
  return record.phoneNumber === null;
}

/**
 * הפרטים בכרטיס פתוח (בכל שורה - הפרט הימני ראשון).
 * המספר, התאריכים והסטטוס כבר מופיעים בתקציר הכרטיס, ולכן לא חוזרים כאן.
 * הסיבה מהרשימה היא שדה של 05 (הסרביס שלו עוד לא הוגדר), ולכן השורה שלה נבנית כאן
 */
export function buildVoiceMessageDetails(record: TraineeVoiceMessageRecordDto): DetailItem[] {
  return [
    {
      key: "repeatDuringCall",
      label: TEXTS.details.repeatDuringCall,
      value: record.repeatDuringCall ? TEXTS.details.yes : TEXTS.details.no,
      isFullWidth: true,
    },
    buildReasonDetailItem(record.reason),
    ...buildDecisionDetailItems(record),
  ];
}

// ── חיפוש ומיון (ספק 05 history §4, ספק 00 §4.1) ──

/** הערכים הגלויים של הרשומה, שהחיפוש בודק */
function buildVoiceMessageSearchParts(record: TraineeVoiceMessageRecordDto): string[] {
  return [
    record.phoneNumber ?? TEXTS.card.allCalls,
    record.repeatDuringCall ? TEXTS.details.repeatDuringCall : "",
    record.reason,
    ...decisionSearchParts(record),
    formatDateRange(record.dateStart, record.dateEnd),
    record.dateStart,
    record.dateEnd,
  ];
}

export function filterAndSortVoiceMessages(
  records: TraineeVoiceMessageRecordDto[],
  searchQuery: string,
  sort: HistorySortOption,
): TraineeVoiceMessageRecordDto[] {
  return sortHistoryRecords(filterBySearchQuery(records, searchQuery, buildVoiceMessageSearchParts), sort);
}

/** "מוצגות X הודעות" מתחת לחיפוש, לפי ההודעות שמוצגות אחרי החיפוש */
export function buildVoiceMessagesCountText(visibleRecords: TraineeVoiceMessageRecordDto[]): string {
  return TEXTS.toolbar.resultsCount(visibleRecords.length);
}
