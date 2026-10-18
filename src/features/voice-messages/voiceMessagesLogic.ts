import { sortHistoryRecords, type HistorySortOption } from "@/features/records/history/historySort";
import type { DetailItem } from "@/features/records/history/recordDetails";
import type { TraineeVoiceMessageRecordDto } from "@/schemas/voice-messages.schema";
import { formatDateRange } from "@/shared/formatting/dateFormat";
import { filterBySearchQuery } from "@/shared/search/searchText";
import { VOICE_MESSAGES_TEXTS } from "./voiceMessagesTexts";

const TEXTS = VOICE_MESSAGES_TEXTS;

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
 * המספר, התאריכים והסטטוס כבר מופיעים בתקציר הכרטיס, ולכן לא חוזרים כאן
 */
export function buildVoiceMessageDetails(record: TraineeVoiceMessageRecordDto): DetailItem[] {
  const details: DetailItem[] = [
    {
      key: "repeatDuringCall",
      label: TEXTS.details.repeatDuringCall,
      value: record.repeatDuringCall ? TEXTS.details.yes : TEXTS.details.no,
      isFullWidth: true,
    },
    { key: "reason", label: TEXTS.details.reason, value: record.reason || TEXTS.details.notSpecified },
    {
      key: "approver",
      label: TEXTS.details.approver,
      value: record.approver.fullName || TEXTS.details.notSpecified,
    },
  ];

  if (record.details) {
    details.push({ key: "details", label: TEXTS.details.details, value: record.details, isFullWidth: true });
  }
  return details;
}

// ── חיפוש ומיון (ספק 05 history §4, ספק 00 §4.1) ──

/** הערכים הגלויים של הרשומה, שהחיפוש בודק */
function buildVoiceMessageSearchParts(record: TraineeVoiceMessageRecordDto): string[] {
  return [
    record.phoneNumber ?? TEXTS.card.allCalls,
    record.repeatDuringCall ? TEXTS.details.repeatDuringCall : "",
    record.reason,
    record.details,
    record.approver.fullName,
    formatDateRange(record.startDate, record.endDate),
    record.startDate,
    record.endDate,
  ];
}

export function filterAndSortVoiceMessages(
  records: TraineeVoiceMessageRecordDto[],
  searchQuery: string,
  sort: HistorySortOption,
): TraineeVoiceMessageRecordDto[] {
  return sortHistoryRecords(filterBySearchQuery(records, searchQuery, buildVoiceMessageSearchParts), sort);
}
