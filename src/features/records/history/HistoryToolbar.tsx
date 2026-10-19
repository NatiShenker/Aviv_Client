import { IpsIconButton, IpsSearchFieldMobile } from "ui-library";
import AppIcon from "@/shared/icons/AppIcon";
import { HISTORY_TEXTS } from "./historyTexts";

const TEXTS = HISTORY_TEXTS.toolbar;

interface HistoryToolbarProps {
  /** כותרת המקטע, למשל "היסטוריית הגבלות" */
  title: string;
  searchQuery: string;
  onSearchQueryChange: (searchQuery: string) => void;
  searchLabel: string;
  searchPlaceholder: string;
  onSortClick: () => void;
  /** כל עוד אין רשימה מוכנה, החיפוש והמיון מושבתים */
  isDisabled: boolean;
}

/**
 * מעל רשימת ההיסטוריה, באותו מבנה כמו ברשימת החניכים (ספק 00 §3.23):
 * שורה 1 - כותרת המקטע; שורה 2 - שדה חיפוש וכפתור מיון, שניהם בגובה 44, לבנים ועם מסגרת כמו שדות הטופס.
 */
export default function HistoryToolbar({
  title,
  searchQuery,
  onSearchQueryChange,
  searchLabel,
  searchPlaceholder,
  onSortClick,
  isDisabled,
}: HistoryToolbarProps) {
  return (
    <div className="mt-4 flex flex-col gap-3">
      <h2 className="truncate text-lg font-medium">{title}</h2>

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
    </div>
  );
}
