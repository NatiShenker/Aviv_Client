import { useId } from "react";
import { IpsButton, IpsSelect, type IpsSelectOption } from "ui-library";
import FieldLabelText from "@/shared/components/form/FieldLabelText";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { WingDto, WingLocationDto } from "@/types/organization.schema";
import type { TraineeListFiltersState } from "@/types/trainees.schema";
import { focusInPlace } from "@/utils/dom";
import {
  buildMultiSelectionSummary,
  resolveLocationsFieldState,
  toFilterIds,
} from "../traineesFilterFieldsLogic";
import {
  BALANCE_FILTER_OPTIONS,
  PHONE_EXCEPTION_FILTER_OPTIONS,
  RECIPIENT_MESSAGE_FILTER_OPTIONS,
  TRAINEE_RESTRICTION_FILTER_OPTIONS,
  findOptionValue,
  type FilterOption,
} from "../traineesListOptions";
import { TRAINEES_LIST_TEXTS } from "../traineesListTexts";
import { useTraineeFilterOptions } from "../useTraineeFilterOptions";
import type { TraineeFilterGroupsUpdate } from "../useTraineesListFilters";

const PANEL_TEXTS = TRAINEES_LIST_TEXTS.filterPanel;
const GROUP_TEXTS = TRAINEES_LIST_TEXTS.filters.groups;
const FILTER_TEXTS = TRAINEES_LIST_TEXTS.filters;

// "ניקוי מסננים" היא פעולה משנית: כפתור טקסט 14/500, באותו מראה כמו במגירת הסינון במובייל.
// כפתורי הטקסט של הספרייה הם 16, ולכן הגודל מותאם כאן, במקום השימוש
const CLEAR_FILTERS_BUTTON_SX = {
  fontSize: "14px",
  fontWeight: 500,
} as const;

interface TraineesFiltersPanelProps {
  filters: TraineeListFiltersState;
  wings: WingDto[];
  locations: AsyncResource<WingLocationDto[]>;
  activeFilterCount: number;
  /** לפני שנבחרה פנימייה הפאנל מוצג מושבת, ולא מוסתר - כדי שהתוצאות לא יזוזו כשהוא מופיע */
  hasSelectedInstitute: boolean;
  /** כל עוד אין רשימה מוכנה, המסננים מושבתים (כמו כפתור הסינון במובייל) */
  isDisabled: boolean;
  onWingIdsChange: (wingIds: number[]) => void;
  onFiltersChange: (update: TraineeFilterGroupsUpdate) => void;
  onClearFilters: () => void;
}

/**
 * פאנל המסננים בדסקטופ: שש קבוצות הסינון בשורה אחת. כל בחירה מוחלת מיד (ספק 01 §4.3).
 * בלי כותרת גלויה (השם שלו לקורא מסך בלבד): "ניקוי מסננים" בשורה דקה מעל השדות, בקצה - כמו במובייל
 */
export default function TraineesFiltersPanel({
  filters,
  wings,
  locations,
  activeFilterCount,
  hasSelectedInstitute,
  isDisabled,
  onWingIdsChange,
  onFiltersChange,
  onClearFilters,
}: TraineesFiltersPanelProps) {
  const wingFieldId = useId();
  const { wingOptions, locationOptions } = useTraineeFilterOptions(wings, locations.data, filters.wingIds);

  // הכפתור נהיה מושבת מיד אחרי הניקוי, ולכן הפוקוס עובר למסנן הראשון ולא נופל לתחילת העמוד
  const clearFilters = () => {
    onClearFilters();
    focusInPlace(wingFieldId);
  };

  return (
    <section aria-label={PANEL_TEXTS.title} className="shrink-0 rounded-card bg-paper p-4">
      <div className="flex justify-end">
        <IpsButton
          variant="text"
          size="small"
          disabled={isDisabled || activeFilterCount === 0}
          onClick={clearFilters}
          sx={CLEAR_FILTERS_BUTTON_SX}
        >
          {PANEL_TEXTS.clearFilters}
        </IpsButton>
      </div>

      <div className="mt-2 grid grid-cols-6 gap-4">
        <MultiFilterSelect
          id={wingFieldId}
          label={GROUP_TEXTS.wing}
          options={wingOptions}
          selectedIds={filters.wingIds}
          isDisabled={isDisabled}
          onChange={onWingIdsChange}
        />
        <LocationFilter
          locations={locations}
          options={locationOptions}
          selectedLocationIds={filters.locationIds}
          hasSelectedInstitute={hasSelectedInstitute}
          isDisabled={isDisabled}
          onChange={(locationIds) => onFiltersChange({ locationIds })}
        />
        <FilterSelect
          label={GROUP_TEXTS.traineeRestriction}
          options={TRAINEE_RESTRICTION_FILTER_OPTIONS}
          value={filters.traineeRestriction}
          isDisabled={isDisabled}
          onChange={(traineeRestriction) => onFiltersChange({ traineeRestriction })}
        />
        <FilterSelect
          label={GROUP_TEXTS.recipientMessage}
          options={RECIPIENT_MESSAGE_FILTER_OPTIONS}
          value={filters.recipientMessage}
          isDisabled={isDisabled}
          onChange={(recipientMessage) => onFiltersChange({ recipientMessage })}
        />
        <FilterSelect
          label={GROUP_TEXTS.phoneException}
          options={PHONE_EXCEPTION_FILTER_OPTIONS}
          value={filters.phoneException}
          isDisabled={isDisabled}
          onChange={(phoneException) => onFiltersChange({ phoneException })}
        />
        <FilterSelect
          label={GROUP_TEXTS.balance}
          options={BALANCE_FILTER_OPTIONS}
          value={filters.balance}
          isDisabled={isDisabled}
          onChange={(balance) => onFiltersChange({ balance })}
        />
      </div>
    </section>
  );
}

interface MultiFilterSelectProps {
  /** על הכפתור שפותח את הרשימה, כדי שאפשר יהיה להעביר אליו פוקוס */
  id?: string;
  label: string;
  options: IpsSelectOption[];
  selectedIds: number[];
  isDisabled: boolean;
  /** טקסט מצב במקום הערך, בתוך השדה (למשל "טוען מיקומים…") - כדי שהפאנל לא יגדל בשורה */
  statusText?: string;
  hasError?: boolean;
  helperText?: string;
  onChange: (selectedIds: number[]) => void;
}

// בחירה מרובה בלי אפשרות "הכל" מפורשת: בחירה ריקה מוצגת כ"הכל" (pending-decisions)
function MultiFilterSelect({
  id,
  label,
  options,
  selectedIds,
  isDisabled,
  statusText,
  hasError = false,
  helperText,
  onChange,
}: MultiFilterSelectProps) {
  const labelId = useId();

  return (
    <div className="min-w-0">
      <FieldLabelText id={labelId} text={label} />
      <IpsSelect
        multiple
        labelId={labelId}
        SelectDisplayProps={id ? { id } : undefined}
        options={options}
        value={selectedIds}
        placeholder={FILTER_TEXTS.all}
        renderValue={() => statusText ?? buildMultiSelectionSummary(options, selectedIds)}
        disabled={isDisabled}
        error={hasError}
        helperText={helperText}
        onChange={(value) => onChange(Array.isArray(value) ? toFilterIds(value) : [])}
      />
    </div>
  );
}

interface LocationFilterProps {
  /** המיקומים נטענים ברקע, ולכן לשדה יש מצבי טעינה ושגיאה משלו */
  locations: AsyncResource<WingLocationDto[]>;
  options: IpsSelectOption[];
  selectedLocationIds: number[];
  /** בלי פנימייה אין מיקומים לטעון, ולכן גם אין מצב טעינה */
  hasSelectedInstitute: boolean;
  isDisabled: boolean;
  onChange: (locationIds: number[]) => void;
}

/**
 * הטעינה מוצגת בתוך השדה המושבת, כדי שהפאנל לא יקפוץ כשהיא מסתיימת.
 * שגיאה מוצגת מתחת לשדה, עם "טעינה מחדש"
 */
function LocationFilter({
  locations,
  options,
  selectedLocationIds,
  hasSelectedInstitute,
  isDisabled,
  onChange,
}: LocationFilterProps) {
  const fieldState = resolveLocationsFieldState(locations.status);
  const isLoading = hasSelectedInstitute && fieldState.isUnavailable && !fieldState.hasFailed;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <MultiFilterSelect
        label={GROUP_TEXTS.location}
        options={options}
        selectedIds={selectedLocationIds}
        isDisabled={isDisabled || fieldState.isUnavailable}
        statusText={isLoading ? fieldState.statusText : undefined}
        hasError={fieldState.hasFailed}
        helperText={fieldState.hasFailed ? fieldState.statusText : undefined}
        onChange={onChange}
      />
      {fieldState.hasFailed && (
        <IpsButton variant="text" size="small" className="self-start" onClick={locations.reload}>
          {FILTER_TEXTS.retry}
        </IpsButton>
      )}
    </div>
  );
}

interface FilterSelectProps<TValue extends string> {
  label: string;
  options: FilterOption<TValue>[];
  value: TValue;
  isDisabled: boolean;
  onChange: (value: TValue) => void;
}

// בחירה יחידה מתוך אפשרויות קבועות, ו"הכל" היא אחת מהן (כמו הצ'יפים במובייל)
function FilterSelect<TValue extends string>({ label, options, value, isDisabled, onChange }: FilterSelectProps<TValue>) {
  const labelId = useId();

  const handleChange = (selectedValue: unknown) => {
    const optionValue = findOptionValue(options, selectedValue);
    if (optionValue) {
      onChange(optionValue);
    }
  };

  return (
    <div className="min-w-0">
      <FieldLabelText id={labelId} text={label} />
      <IpsSelect labelId={labelId} options={options} value={value} disabled={isDisabled} onChange={handleChange} />
    </div>
  );
}
