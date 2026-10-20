import type { ReactNode } from "react";
import { IpsButton } from "ui-library";
import AppIcon from "@/shared/components/AppIcon";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import { DRAWER_ROW_GUTTER_CLASS, DRAWER_SCROLL_AREA_CLASS } from "@/shells/desktop/drawer/drawerSpacing";
import DrawerTopBar from "@/shells/desktop/drawer/DrawerTopBar";
import type { RenderCardFrame } from "../history/historyCardFrame";
import HistoryCardsList, { type RecordHistoryTexts } from "../history/HistoryCardsList";
import type { RecordHistoryState } from "../history/useRecordHistoryState";
import DesktopHistoryToolbar from "./DesktopHistoryToolbar";

// כרטיס על משטח לבן (המגירה) מקבל מסגרת (design.md). המסגרת על העוטף, כדי שהכרטיס יישאר זהה למובייל
export const renderDrawerCardFrame: RenderCardFrame = (card) => (
  <div className="rounded-card border border-divider">{card}</div>
);

interface DrawerHistoryLayoutProps<TRecord, TRecordKey extends string | number> {
  /** השורה העליונה: חזרה ושם הפעולה */
  navigation: ReactNode;
  texts: RecordHistoryTexts;
  records: AsyncResource<TRecord[]>;
  history: RecordHistoryState<TRecord, TRecordKey>;
  getRecordKey: (record: TRecord) => TRecordKey;
  renderCard: (record: TRecord) => ReactNode;
  onCreate: () => void;
}

/**
 * מסך היסטוריה במגירה (ספק 00 §4.4): השורה העליונה, וסרגל עם כותרת המקטע, כפתור היצירה, החיפוש והמיון - קבועים,
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
      <DrawerTopBar>{navigation}</DrawerTopBar>

      <div className={`shrink-0 pb-4 ${DRAWER_ROW_GUTTER_CLASS}`}>
        <DesktopHistoryToolbar
          title={texts.toolbar.sectionTitle}
          createButton={
            <IpsButton variant="contained" endIcon={<AppIcon name="add" />} onClick={onCreate}>
              {texts.newRecord}
            </IpsButton>
          }
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
        className={`min-h-0 flex-1 pb-6 ${DRAWER_SCROLL_AREA_CLASS}`}
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
