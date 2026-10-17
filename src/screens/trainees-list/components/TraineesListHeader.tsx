import { IpsIconButton, IpsSearchFieldMobile } from "ui-library";
import InstituteSelector from "@/context/institutes/InstituteSelector";
import AppIcon from "@/shared/icons/AppIcon";
import { TRAINEES_LIST_TEXTS } from "../traineesListTexts";

const TEXTS = TRAINEES_LIST_TEXTS;

interface TraineesListHeaderProps {
  searchQuery: string;
  onSearchQueryChange: (searchQuery: string) => void;
  isFilterActive: boolean;
  /** כל עוד אין רשימה מוכנה, החיפוש, הסינון והמיון מושבתים */
  areToolsDisabled: boolean;
  onFilterClick: () => void;
  onSortClick: () => void;
}

/** מעל הרשימה: שורה 1 - כותרת ובורר פנימייה; שורה 2 - חיפוש, סינון ומיון */
export default function TraineesListHeader({
  searchQuery,
  onSearchQueryChange,
  isFilterActive,
  areToolsDisabled,
  onFilterClick,
  onSortClick,
}: TraineesListHeaderProps) {
  return (
    <header className="flex flex-col gap-3 px-5">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <h1 className="shrink-0 text-lg font-medium">{TEXTS.title}</h1>
        {/* הבורר יורש את הגופן והצבע מהעוטף */}
        <div className="min-w-0 text-base font-medium text-primary">
          <InstituteSelector />
        </div>
      </div>

      {/* שורה אחידה: שדה חיפוש ושני כפתורים עגולים, כולם בגובה 44 על רקע לבן ובלי מסגרת */}
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <IpsSearchFieldMobile
            value={searchQuery}
            onChange={onSearchQueryChange}
            placeholder={TEXTS.toolbar.searchPlaceholder}
            aria-label={TEXTS.toolbar.searchLabel}
            clearButtonLabel={TEXTS.toolbar.clearSearch}
            disabled={areToolsDisabled}
          />
        </div>
        <FilterButton isActive={isFilterActive} disabled={areToolsDisabled} onClick={onFilterClick} />
        <IpsIconButton
          variant="surface"
          icon={<AppIcon name="sort" />}
          aria-label={TEXTS.toolbar.sort}
          disabled={areToolsDisabled}
          onClick={onSortClick}
        />
      </div>
    </header>
  );
}

interface FilterButtonProps {
  isActive: boolean;
  disabled: boolean;
  onClick: () => void;
}

// כשיש סינון פעיל מוצגת נקודה צבעונית על האייקון, וקורא המסך מקבל את המצב בשם הכפתור
function FilterButton({ isActive, disabled, onClick }: FilterButtonProps) {
  return (
    <span className="relative inline-flex">
      <IpsIconButton
        variant="surface"
        icon={<AppIcon name="filter" />}
        aria-label={isActive ? TEXTS.toolbar.filterWhenActive : TEXTS.toolbar.filter}
        disabled={disabled}
        onClick={onClick}
      />
      {isActive && (
        <span aria-hidden="true" className="pointer-events-none absolute end-2 top-2 size-2 rounded-full bg-primary" />
      )}
    </span>
  );
}
