import { IpsSelect, IpsTextField } from "ui-library";
import { TRAINEE_SORT_ROWS, findSortOption, type TraineeSortOption } from "../traineesListOptions";
import { TRAINEES_LIST_TEXTS } from "../traineesListTexts";

const TEXTS = TRAINEES_LIST_TEXTS.toolbar;

interface TraineesResultsToolbarProps {
  searchQuery: string;
  onSearchQueryChange: (searchQuery: string) => void;
  /** מספר החניכים אחרי חיפוש וסינון. null כל עוד הרשימה לא מוכנה */
  resultCount: number | null;
  sort: TraineeSortOption;
  onSortChange: (sort: TraineeSortOption) => void;
  /** כל עוד אין רשימה מוכנה, החיפוש והמיון מושבתים */
  isDisabled: boolean;
}

/**
 * הסרגל שבראש פאנל התוצאות בדסקטופ: החיפוש ומיד אחריו מספר התוצאות שלו, והמיון בקצה.
 * אין תוויות מעל השדות, כדי שכל השורה תהיה בגובה אחד: לחיפוש יש placeholder, והמיון אומר "מיין לפי" בערך שלו
 */
export default function TraineesResultsToolbar({
  searchQuery,
  onSearchQueryChange,
  resultCount,
  sort,
  onSortChange,
  isDisabled,
}: TraineesResultsToolbarProps) {
  return (
    <div className="flex shrink-0 items-center gap-4 border-b border-divider p-4">
      <div className="w-80 shrink-0">
        <IpsTextField
          type="search"
          fullWidth
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder={TEXTS.searchPlaceholder}
          clearButtonLabel={TEXTS.clearSearch}
          inputProps={{ "aria-label": TEXTS.searchLabel }}
          disabled={isDisabled}
        />
      </div>

      {resultCount !== null && (
        <p role="status" className="shrink-0 text-sm text-text-muted">
          {TEXTS.resultsCount(resultCount)}
        </p>
      )}

      <div className="ms-auto w-80 shrink-0">
        <IpsSelect
          options={TRAINEE_SORT_ROWS}
          value={sort.key}
          // הקידומת רק בערך הסגור; השורות ברשימה נשארות נקיות לסריקה
          renderValue={() => TEXTS.sortValue(sort.label)}
          inputProps={{ "aria-label": TEXTS.sort }}
          disabled={isDisabled}
          onChange={(selectedKey) => onSortChange(findSortOption(String(selectedKey)))}
        />
      </div>
    </div>
  );
}
