import { IpsIconButton, IpsSearchFieldMobile } from "ui-library";
import AppIcon from "@/shared/components/AppIcon";
import ResultsCountLine from "@/shared/components/ResultsCountLine";
import { HISTORY_TEXTS } from "../history/historyTexts";

const TEXTS = HISTORY_TEXTS.toolbar;

interface HistoryToolbarProps {
  /** כותרת המקטע, למשל "היסטוריית הגבלות" */
  title: string;
  searchQuery: string;
  onSearchQueryChange: (searchQuery: string) => void;
  searchLabel: string;
  searchPlaceholder: string;
  onSortClick: () => void;
  /** "מוצגות X הגבלות" וכדומה. null - אין מה להציג (שגיאה, אין רשומות) */
  resultsCountText: string | null;
  /** בזמן טעינת הרשומות שורת המספר מציגה שלד */
  isResultsCountLoading: boolean;
  /** כל עוד אין רשימה מוכנה, החיפוש והמיון מושבתים */
  isDisabled: boolean;
}

/**
 * מעל רשימת ההיסטוריה, באותו מבנה כמו ברשימת החניכים (ספק 00 §3.23):
 * שורה 1 - כותרת המקטע; שורה 2 - שדה חיפוש וכפתור מיון, שניהם בגובה 44, לבנים ועם מסגרת כמו שדות הטופס;
 * שורה 3 - מספר התוצאות.
 */
export default function HistoryToolbar({
  title,
  searchQuery,
  onSearchQueryChange,
  searchLabel,
  searchPlaceholder,
  onSortClick,
  resultsCountText,
  isResultsCountLoading,
  isDisabled,
}: HistoryToolbarProps) {
  return (
    <div className="mt-4 flex flex-col gap-3">
      {/* כותרת מקטע: 16 רגיל, קטנה מכותרת המסך - כמו המקטעים בטופס ורמה 3 בדסקטופ (ספק 00 §3.23) */}
      <h2 className="truncate text-base">{title}</h2>

      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <IpsSearchFieldMobile
            value={searchQuery}
            onChange={onSearchQueryChange}
            placeholder={searchPlaceholder}
            aria-label={searchLabel}
            clearButtonLabel={TEXTS.clearSearch}
            disabled={isDisabled}
          />
        </div>
        <IpsIconButton
          variant="surface"
          icon={<AppIcon name="sort" />}
          aria-label={TEXTS.sort}
          disabled={isDisabled}
          onClick={onSortClick}
        />
      </div>

      {/* ננעץ עם הכלים, כדי שהמספר יתעדכן לנגד העיניים בזמן החיפוש - כמו ברשימת החניכים */}
      <ResultsCountLine className="-mt-1" isLoading={isResultsCountLoading} text={resultsCountText} />
    </div>
  );
}
