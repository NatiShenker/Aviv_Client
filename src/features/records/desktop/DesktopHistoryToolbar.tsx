import type { ReactNode } from "react";
import { IpsSelect, IpsTextField } from "ui-library";
import AppIcon from "@/shared/components/AppIcon";
import ResultsCountLine from "@/shared/components/ResultsCountLine";
import {
  buildHistorySortRows,
  findHistorySortOption,
  historySortLabel,
  type StatusSortTexts,
} from "../history/historySort";
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
  /** תוויות מיון הסטטוס של הפעולה, במין של הרשומה */
  statusSortTexts: StatusSortTexts;
  /** "מוצגות X הגבלות" וכדומה. null - אין מה להציג (שגיאה, אין רשומות) */
  resultsCountText: string | null;
  /** בזמן טעינת הרשומות שורת המספר מציגה שלד */
  isResultsCountLoading: boolean;
  /** כל עוד אין רשימה מוכנה, החיפוש והמיון מושבתים */
  isDisabled: boolean;
}

/**
 * מעל רשימת ההיסטוריה במגירה (ספק 00 §4.4): כותרת המקטע וכפתור היצירה, מתחתם חיפוש שתמיד גלוי ובורר מיון,
 * ומתחת לחיפוש מספר התוצאות.
 * הכותרת ברמת מקטע (16, רגיל), מתחת לשם החניך ולבורר הפעולה - כדי שלא יהיו שלוש כותרות באותו משקל.
 * גם בקורא מסך: h4, מתחת לשם החניך (h2) ולשם הפעולה (h3).
 * ברוחב המגירה אין מקום ל"מיון לפי …" ליד החיפוש, ולכן הבורר סגור מציג רק "מיון", כמו כפתור המיון במובייל;
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
  statusSortTexts,
  resultsCountText,
  isResultsCountLoading,
  isDisabled,
}: DesktopHistoryToolbarProps) {
  const currentSortLabel = historySortLabel(findHistorySortOption(sortKey), statusSortTexts);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="min-w-0 truncate text-base">{title}</h4>
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
            options={buildHistorySortRows(statusSortTexts)}
            value={sortKey}
            // רק בערך הסגור; השורות ברשימה מלאות
            renderValue={() => <SortValue />}
            inputProps={{ "aria-label": TEXTS.sortWithCurrent(currentSortLabel) }}
            disabled={isDisabled}
            onChange={(selectedKey) => onSortChange(String(selectedKey))}
          />
        </div>
      </div>

      {/* ברוחב המגירה אין לו מקום ליד החיפוש, ולכן בשורה משלו - כמו במובייל */}
      <ResultsCountLine className="-mt-1" isLoading={isResultsCountLoading} text={resultsCountText} />
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
