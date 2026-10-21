import type { ReactNode } from "react";
import { IpsButton } from "ui-library";
import AppIcon from "@/shared/components/AppIcon";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import PinnedPageTop from "@/shells/mobile/PinnedPageTop";
import { SCREEN_SIDE_GUTTER_CLASS } from "@/shells/mobile/screenSpacing";
import SortSheet from "@/shells/mobile/SortSheet";
import StickyActionBar from "@/shells/mobile/StickyActionBar";
import HistoryCardsList, { type RecordHistoryTexts } from "../history/HistoryCardsList";
import { buildHistorySortRows } from "../history/historySort";
import type { RecordHistoryState } from "../history/useRecordHistoryState";
import HistoryToolbar from "./HistoryToolbar";

interface RecordHistoryLayoutProps<TRecord, TRecordKey extends string | number> {
  /** כותרת המסך. נעוצה יחד עם שורת הכלים, והרשימה נגללת מתחת לשתיהן */
  header: ReactNode;
  texts: RecordHistoryTexts;
  records: AsyncResource<TRecord[]>;
  history: RecordHistoryState<TRecord, TRecordKey>;
  /** "מוצגות X הגבלות" וכדומה - בנוי בפעולה, לפי הרשומות שמוצגות אחרי החיפוש */
  resultsCountText: string;
  getRecordKey: (record: TRecord) => TRecordKey;
  renderCard: (record: TRecord) => ReactNode;
  onCreate: () => void;
}

/**
 * מסך היסטוריה במובייל (ספק 00 §4.1): הכותרת ושורת הכלים נעוצות והכרטיסים נגללים מתחתן,
 * מגירת המיון, וכפתור היצירה בתחתית
 */
export default function RecordHistoryLayout<TRecord, TRecordKey extends string | number>({
  header,
  texts,
  records,
  history,
  resultsCountText,
  getRecordKey,
  renderCard,
  onCreate,
}: RecordHistoryLayoutProps<TRecord, TRecordKey>) {
  return (
    <>
      <PinnedPageTop>
        {header}
        <div className={SCREEN_SIDE_GUTTER_CLASS}>
          <HistoryToolbar
            title={texts.toolbar.sectionTitle}
            searchQuery={history.searchQuery}
            onSearchQueryChange={history.setSearchQuery}
            searchLabel={texts.toolbar.searchLabel}
            searchPlaceholder={texts.toolbar.searchPlaceholder}
            onSortClick={history.openSort}
            resultsCountText={records.status === "success" ? resultsCountText : null}
            isResultsCountLoading={records.status === "idle" || records.status === "loading"}
            isDisabled={records.status !== "success"}
          />
        </div>
      </PinnedPageTop>

      <div className={SCREEN_SIDE_GUTTER_CLASS}>
        <HistoryCardsList
          records={records}
          visibleRecords={history.visibleRecords}
          getRecordKey={getRecordKey}
          renderCard={renderCard}
          texts={texts.states}
        />
      </div>

      <SortSheet
        open={history.isSortOpen}
        onClose={history.closeSort}
        rows={buildHistorySortRows(texts.statusSort)}
        selectedValue={history.sortKey}
        onChange={history.changeSort}
      />

      <StickyActionBar>
        <IpsButton variant="contained" size="large" fullWidth endIcon={<AppIcon name="add" />} onClick={onCreate}>
          {texts.newRecord}
        </IpsButton>
      </StickyActionBar>
    </>
  );
}
