import { useMemo, useState } from "react";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import { DEFAULT_HISTORY_SORT_OPTION, findHistorySortOption, type HistorySortOption } from "./historySort";
import { useRevealSavedRecord } from "./useRevealSavedRecord";

// הפניה קבועה, כדי שרשימה ריקה לא תיחשב "רשימה חדשה" בכל רינדור
const NO_RECORDS: never[] = [];

interface RecordHistoryStateOptions<TRecord, TRecordKey> {
  records: AsyncResource<TRecord[]>;
  /** החיפוש והמיון של הפיצ'ר (ספק 00 §4.1) */
  filterAndSort: (records: TRecord[], searchQuery: string, sort: HistorySortOption) => TRecord[];
  /** מזהה ה-DOM של כרטיס, כדי לגלול אליו אחרי שמירה */
  cardDomIdOf: (recordKey: TRecordKey) => string;
}

export interface RecordHistoryState<TRecord, TRecordKey> {
  searchQuery: string;
  setSearchQuery: (searchQuery: string) => void;
  sortKey: string;
  changeSort: (sortKey: string) => void;
  isSortOpen: boolean;
  openSort: () => void;
  closeSort: () => void;
  /** הרשומות אחרי חיפוש ומיון */
  visibleRecords: TRecord[];
  isRecordOpen: (recordKey: TRecordKey) => boolean;
  toggleRecord: (recordKey: TRecordKey) => void;
  showSavedRecord: (savedRecordKey: TRecordKey) => void;
}

/**
 * המצב של מסך היסטוריה, בלי תצוגה ובלי ניווט: חיפוש, מיון, מגירת המיון,
 * הכרטיסים הפתוחים והרשומה שנשמרה
 */
export function useRecordHistoryState<TRecord, TRecordKey extends string | number>({
  records,
  filterAndSort,
  cardDomIdOf,
}: RecordHistoryStateOptions<TRecord, TRecordKey>): RecordHistoryState<TRecord, TRecordKey> {
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState(DEFAULT_HISTORY_SORT_OPTION);
  const [isSortOpen, setIsSortOpen] = useState(false);
  // כל כרטיס נפתח ונסגר בעצמו, וכמה יכולים להיות פתוחים יחד: פתיחת כרטיס לא סוגרת אחר, כדי שהכרטיס שנלחץ
  // לא יקפוץ למעלה כשכרטיס פתוח מעליו נסגר, ושאפשר יהיה להשוות בין רשומות (ספק 00 §3.22, הוחלט 2026-10-21)
  const [openRecordKeys, setOpenRecordKeys] = useState<ReadonlySet<TRecordKey>>(() => new Set());
  const revealSavedRecord = useRevealSavedRecord(records.data);

  const recordList = records.data ?? NO_RECORDS;
  const visibleRecords = useMemo(
    () => filterAndSort(recordList, searchQuery, sort),
    [filterAndSort, recordList, searchQuery, sort],
  );

  const toggleRecord = (recordKey: TRecordKey) => {
    setOpenRecordKeys((currentKeys) => {
      const nextKeys = new Set(currentKeys);
      if (nextKeys.has(recordKey)) {
        nextKeys.delete(recordKey);
      } else {
        nextKeys.add(recordKey);
      }
      return nextKeys;
    });
  };

  // אחרי שמירה: ההיסטוריה מתרעננת ברקע, והרשומה שנשמרה נפתחת וגלויה כשהנתונים החדשים מגיעים (ספק 00 §4.1).
  // הכרטיסים שכבר היו פתוחים נשארים פתוחים.
  // בלי שלד: הכרטיסים הקיימים נשארים עד אז, וכשל ברענון משאיר אותם - בלי הודעת שגיאה מיד אחרי שמירה שהצליחה
  const showSavedRecord = (savedRecordKey: TRecordKey) => {
    setOpenRecordKeys((currentKeys) => new Set(currentKeys).add(savedRecordKey));
    revealSavedRecord(cardDomIdOf(savedRecordKey));
    records.refreshInBackground();
  };

  return {
    searchQuery,
    setSearchQuery,
    sortKey: sort.key,
    changeSort: (sortKey) => setSort(findHistorySortOption(sortKey)),
    isSortOpen,
    openSort: () => setIsSortOpen(true),
    closeSort: () => setIsSortOpen(false),
    visibleRecords,
    isRecordOpen: (recordKey) => openRecordKeys.has(recordKey),
    toggleRecord,
    showSavedRecord,
  };
}
