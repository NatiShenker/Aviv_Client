import type { ReactNode } from "react";
import { IpsSelect, IpsTextField } from "ui-library";
import AppIcon from "@/shared/components/AppIcon";
import { HISTORY_SORT_ROWS, findHistorySortOption } from "../history/historySort";
import { HISTORY_TEXTS } from "../history/historyTexts";

const TEXTS = HISTORY_TEXTS.toolbar;

interface DesktopHistoryToolbarProps {
  /** כותרת המקטע, למשל "היסטוריית הגבלות" */
  title: string;
  /** כפתור היצירה, בקצה שורת הכותרת */
  createButton: ReactNode;
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
 * מעל רשימת ההיסטוריה במגירה (ספק 00 §4.4): כותרת המקטע וכפתור היצירה, ומתחתם חיפוש שתמיד גלוי ובורר מיון.
 * הכותרת ברמת מקטע (16, רגיל), מתחת לשם החניך ולבורר הפעולה - כדי שלא יהיו שלוש כותרות באותו משקל.
 * ברוחב המגירה אין מקום ל"מיין לפי: …" ליד החיפוש, ולכן הבורר סגור מציג רק "מיון", כמו כפתור המיון במובייל;
 * ברשימה שלו שורה לכל צירוף של שדה וכיוון
 */
export default function DesktopHistoryToolbar({
  title,
  createButton,
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
      <div className="flex items-center justify-between gap-3">
        <h3 className="min-w-0 truncate text-base">{title}</h3>
        <div className="shrink-0">{createButton}</div>
      </div>

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
