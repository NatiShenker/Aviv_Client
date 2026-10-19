import type { ReactNode } from "react";
import { IpsButton } from "ui-library";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import AppIcon from "@/shared/icons/AppIcon";
import { DRAWER_SIDE_GUTTER_CLASS } from "@/shells/desktop/drawerSpacing";
import DrawerTopBar from "@/shells/desktop/DrawerTopBar";
import HistoryCardsList, { type RecordHistoryTexts } from "../HistoryCardsList";
import type { RecordHistoryState } from "../useRecordHistoryState";
import DesktopHistoryToolbar from "./DesktopHistoryToolbar";
import { renderDrawerCardFrame } from "./drawerCardFrame";

interface DrawerHistoryLayoutProps<TRecord, TRecordKey extends string | number> {
  /** תחילת השורה העליונה: חזרה ושם הפעולה. כפתור היצירה בקצה שלה */
  navigation: ReactNode;
  texts: RecordHistoryTexts;
  records: AsyncResource<TRecord[]>;
  history: RecordHistoryState<TRecord, TRecordKey>;
  getRecordKey: (record: TRecord) => TRecordKey;
  renderCard: (record: TRecord) => ReactNode;
  onCreate: () => void;
}

/**
 * מסך היסטוריה במגירה (ספק 00 §4.1, פריסת דסקטופ): השורה העליונה עם כפתור היצירה וסרגל החיפוש והמיון קבועים,
 * ורק הכרטיסים שמתחתם נגללים
 */
export default function DrawerHistoryLayout<TRecord, TRecordKey extends string | number>({
  navigation,
  texts,
  records,
  history,
  getRecordKey,
  renderCard,
  onCreate,
}: DrawerHistoryLayoutProps<TRecord, TRecordKey>) {
  return (
    <>
      <DrawerTopBar
        start={navigation}
        end={
          <IpsButton variant="contained" endIcon={<AppIcon name="add" />} onClick={onCreate}>
            {texts.newRecord}
          </IpsButton>
        }
      />

      <div className={`shrink-0 pb-3 ${DRAWER_SIDE_GUTTER_CLASS}`}>
        <DesktopHistoryToolbar
          title={texts.toolbar.sectionTitle}
          searchQuery={history.searchQuery}
          onSearchQueryChange={history.setSearchQuery}
          searchLabel={texts.toolbar.searchLabel}
          searchPlaceholder={texts.toolbar.searchPlaceholder}
          sortKey={history.sortKey}
          onSortChange={history.changeSort}
          isDisabled={records.status !== "success"}
        />
      </div>

      {/* רק הכרטיסים נגללים. האזור ניתן למיקוד, כדי שאפשר יהיה לגלול גם במקלדת (כמו ברשימת החניכים) */}
      <div
        tabIndex={0}
        role="region"
        aria-label={texts.toolbar.sectionTitle}
        className={`min-h-0 flex-1 overflow-y-auto pb-6 ${DRAWER_SIDE_GUTTER_CLASS}`}
      >
        <HistoryCardsList
          records={records}
          visibleRecords={history.visibleRecords}
          getRecordKey={getRecordKey}
          renderCard={renderCard}
          texts={texts.states}
          renderCardFrame={renderDrawerCardFrame}
        />
      </div>
    </>
  );
}
