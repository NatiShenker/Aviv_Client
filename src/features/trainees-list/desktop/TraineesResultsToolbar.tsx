import { useId } from "react";
import { IpsSelect, IpsTextField } from "ui-library";
import FieldLabelText from "@/shared/components/form/FieldLabelText";
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

/** הסרגל שבראש פאנל התוצאות בדסקטופ: חיפוש, מספר התוצאות ומיון */
export default function TraineesResultsToolbar({
  searchQuery,
  onSearchQueryChange,
  resultCount,
  sort,
  onSortChange,
  isDisabled,
}: TraineesResultsToolbarProps) {
  const sortLabelId = useId();

  return (
    <div className="flex shrink-0 items-end gap-4 border-b border-divider p-4">
      {/* בלי תווית גלויה, כמו במובייל: ה-placeholder מסביר, והשם הנגיש מגיע מ-aria-label */}
      <div className="min-w-0 flex-1">
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
        <p role="status" className="shrink-0 pb-2 text-sm text-text-muted">
          {TEXTS.resultsCount(resultCount)}
        </p>
      )}

      <div className="w-72 shrink-0">
        <FieldLabelText id={sortLabelId} text={TEXTS.sort} />
        <IpsSelect
          labelId={sortLabelId}
          options={TRAINEE_SORT_ROWS}
          value={sort.key}
          disabled={isDisabled}
          onChange={(selectedKey) => onSortChange(findSortOption(String(selectedKey)))}
        />
      </div>
    </div>
  );
}
