import type { ReactNode } from "react";
import LoadMoreSentinel from "@/shared/components/LoadMoreSentinel";
import ScreenStateMessage from "@/shared/components/ScreenStateMessage";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import { useIncrementalList } from "@/shared/hooks/useIncrementalList";
import { showCardAsIs, type RenderCardFrame } from "./historyCardFrame";
import HistorySkeleton from "./HistorySkeleton";
import type { StatusSortTexts } from "./historySort";
import { HISTORY_TEXTS } from "./historyTexts";

export interface HistoryListTexts {
  loading: string;
  loadFailed: string;
  /** גם כשאין רשומות בכלל, וגם כשהחיפוש לא מצא (ספק 00 §4.1) */
  noResults: string;
}

/** הטקסטים של מסך ההיסטוריה, מקובץ הטקסטים של הפיצ'ר - משותפים לשתי הפריסות */
export interface RecordHistoryTexts {
  toolbar: { sectionTitle: string; searchLabel: string; searchPlaceholder: string };
  /** תוויות מיון הסטטוס, במין של הרשומה */
  statusSort: StatusSortTexts;
  states: HistoryListTexts;
  /** כפתור היצירה (במובייל בתחתית המסך, בדסקטופ בשורה העליונה) */
  newRecord: string;
}

interface HistoryCardsListProps<TRecord> {
  records: AsyncResource<TRecord[]>;
  /** הרשימה אחרי חיפוש ומיון */
  visibleRecords: TRecord[];
  getRecordKey: (record: TRecord) => string | number;
  renderCard: (record: TRecord) => ReactNode;
  texts: HistoryListTexts;
  /** עוטף כל כרטיס - למשל מסגרת על משטח לבן. בלי - הכרטיסים כמו שהם */
  renderCardFrame?: RenderCardFrame;
  /** עוטף כל כרטיס בשלד. בלי - כמו הכרטיסים (למשל מסגרת בלי ריחוף) */
  renderSkeletonCardFrame?: RenderCardFrame;
  /**
   * מה מתחיל את הרשימה שוב מ-30 הכרטיסים הראשונים (החיפוש והמיון). רענון שקט אחרי שמירה הוא אותה רשימה,
   * ולכן שומר את הכרטיסים שכבר מוצגים - וכרטיס שנשמר מעבר ל-30 עדיין נחשף
   */
  resetVisibleCountOn: readonly unknown[];
}

/** אזור הכרטיסים במסך היסטוריה: טעינה, שגיאה, ריק, או הכרטיסים עצמם */
export default function HistoryCardsList<TRecord>({
  records,
  visibleRecords,
  getRecordKey,
  renderCard,
  texts,
  renderCardFrame = showCardAsIs,
  renderSkeletonCardFrame = renderCardFrame,
  resetVisibleCountOn,
}: HistoryCardsListProps<TRecord>) {
  switch (records.status) {
    case "idle":
    case "loading":
      return <HistorySkeleton loadingLabel={texts.loading} renderCardFrame={renderSkeletonCardFrame} />;
    case "error":
      return (
        <ScreenStateMessage
          tone="error"
          message={texts.loadFailed}
          actionLabel={HISTORY_TEXTS.states.retry}
          onAction={records.reload}
        />
      );
    case "empty":
      return <ScreenStateMessage message={texts.noResults} />;
    case "success":
      if (visibleRecords.length === 0) {
        return <ScreenStateMessage message={texts.noResults} />;
      }
      return (
        <HistoryCards
          visibleRecords={visibleRecords}
          getRecordKey={getRecordKey}
          renderCard={renderCard}
          renderCardFrame={renderCardFrame}
          resetVisibleCountOn={resetVisibleCountOn}
        />
      );
  }
}

type HistoryCardsProps<TRecord> = Pick<
  HistoryCardsListProps<TRecord>,
  "visibleRecords" | "getRecordKey" | "renderCard" | "resetVisibleCountOn"
> & {
  renderCardFrame: RenderCardFrame;
};

// טעינה הדרגתית: 30 כרטיסים בהתחלה, ועוד 30 בכל הגעה לסוף הרשימה. חיפוש או מיון חדש מתחילים מההתחלה
function HistoryCards<TRecord>({
  visibleRecords,
  getRecordKey,
  renderCard,
  renderCardFrame,
  resetVisibleCountOn,
}: HistoryCardsProps<TRecord>) {
  const { visibleItems, hasMore, showMore } = useIncrementalList(visibleRecords, { resetOn: resetVisibleCountOn });

  return (
    <>
      <ul className="flex flex-col gap-2">
        {visibleItems.map((record) => (
          <li key={getRecordKey(record)}>{renderCardFrame(renderCard(record))}</li>
        ))}
      </ul>
      {hasMore && <LoadMoreSentinel renderedCount={visibleItems.length} onVisible={showMore} />}
    </>
  );
}
