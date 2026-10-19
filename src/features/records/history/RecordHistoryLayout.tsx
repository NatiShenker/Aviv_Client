import type { ReactNode } from "react";
import { IpsButton } from "ui-library";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import AppIcon from "@/shared/icons/AppIcon";
import PinnedPageTop from "@/shells/mobile/PinnedPageTop";
import { SCREEN_SIDE_GUTTER_CLASS } from "@/shells/mobile/screenSpacing";
import SortSheet from "@/shells/mobile/SortSheet";
import StickyActionBar from "@/shells/mobile/StickyActionBar";
import HistoryCardsList, { type RecordHistoryTexts } from "./HistoryCardsList";
import { HISTORY_SORT_ROWS } from "./historySort";
import HistoryToolbar from "./HistoryToolbar";
import type { RecordHistoryState } from "./useRecordHistoryState";

interface RecordHistoryLayoutProps<TRecord, TRecordKey extends string | number> {
  /** כותרת המסך. נעוצה יחד עם שורת הכלים, והרשימה נגללת מתחת לשתיהן */
  header: ReactNode;
  texts: RecordHistoryTexts;
  records: AsyncResource<TRecord[]>;
  history: RecordHistoryState<TRecord, TRecordKey>;
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
        rows={HISTORY_SORT_ROWS}
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
