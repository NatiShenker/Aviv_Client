import { IpsSelect, IpsTextField } from "ui-library";
import AppIcon from "@/shared/icons/AppIcon";
import { HISTORY_SORT_ROWS, findHistorySortOption } from "../historySort";
import { HISTORY_TEXTS } from "../historyTexts";

const TEXTS = HISTORY_TEXTS.toolbar;

interface DesktopHistoryToolbarProps {
  /** כותרת המקטע, למשל "היסטוריית הגבלות" */
  title: string;
  searchQuery: string;
  onSearchQueryChange: (searchQuery: string) => void;
  searchLabel: string;
  searchPlaceholder: string;
  sortKey: string;
  onSortChange: (sortKey: string) => void;
  /** כל עוד אין רשימה מוכנה, החיפוש והמיון מושבתים */
  isDisabled: boolean;
}

/**
 * מעל רשימת ההיסטוריה במגירה (ספק 00 §3.23, פריסת דסקטופ): כותרת המקטע, ומתחתיה חיפוש שתמיד גלוי ובורר מיון.
 * ברוחב המגירה אין מקום ל"מיין לפי: …" ליד החיפוש, ולכן הבורר סגור מציג רק "מיון", כמו כפתור המיון במובייל;
 * ברשימה שלו שורה לכל צירוף של שדה וכיוון
 */
export default function DesktopHistoryToolbar({
  title,
  searchQuery,
  onSearchQueryChange,
  searchLabel,
  searchPlaceholder,
  sortKey,
  onSortChange,
  isDisabled,
}: DesktopHistoryToolbarProps) {
  const currentSortLabel = findHistorySortOption(sortKey).label;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="truncate text-lg font-medium">{title}</h3>

      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <IpsTextField
            type="search"
            fullWidth
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder={searchPlaceholder}
            clearButtonLabel={TEXTS.clearSearch}
            inputProps={{ "aria-label": searchLabel }}
            disabled={isDisabled}
          />
        </div>
        <div className="shrink-0">
          <IpsSelect
            options={HISTORY_SORT_ROWS}
            value={sortKey}
            // רק בערך הסגור; השורות ברשימה מלאות
            renderValue={() => <SortValue />}
            inputProps={{ "aria-label": TEXTS.sortWithCurrent(currentSortLabel) }}
            disabled={isDisabled}
            onChange={(selectedKey) => onSortChange(String(selectedKey))}
          />
        </div>
      </div>
    </div>
  );
}

function SortValue() {
  return (
    <span className="flex items-center gap-1">
      <AppIcon name="sort" size="small" />
      {TEXTS.sort}
    </span>
  );
}
