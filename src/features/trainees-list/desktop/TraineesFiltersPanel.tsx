import { useId } from "react";
import { IpsButton, IpsSelect, type IpsSelectOption } from "ui-library";
import AppIcon from "@/shared/components/AppIcon";
import FieldLabelText from "@/shared/components/form/FieldLabelText";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { WingDto, WingLocationDto } from "@/types/organization.schema";
import type { TraineeListFiltersState } from "@/types/trainees.schema";
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
const GROUP_TEXTS = TRAINEES_LIST_TEXTS.filterDrawer.groups;
const FILTER_TEXTS = TRAINEES_LIST_TEXTS.filterDrawer;

interface TraineesFiltersPanelProps {
  filters: TraineeListFiltersState;
  wings: WingDto[];
  locations: AsyncResource<WingLocationDto[]>;
  activeFilterCount: number;
  /** כל עוד אין רשימה מוכנה, המסננים מושבתים (כמו כפתור הסינון במובייל) */
  isDisabled: boolean;
  onWingIdsChange: (wingIds: number[]) => void;
  onFiltersChange: (update: TraineeFilterGroupsUpdate) => void;
  onClearFilters: () => void;
}

/** פאנל המסננים בדסקטופ: שש קבוצות הסינון בשורה אחת. כל בחירה מוחלת מיד (ספק 01 §4.3) */
export default function TraineesFiltersPanel({
  filters,
  wings,
  locations,
  activeFilterCount,
  isDisabled,
  onWingIdsChange,
  onFiltersChange,
  onClearFilters,
}: TraineesFiltersPanelProps) {
  const titleId = useId();
  const { wingOptions, locationOptions } = useTraineeFilterOptions(wings, locations.data, filters.wingIds);

  return (
    <section aria-labelledby={titleId} className="shrink-0 rounded-card bg-paper p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 id={titleId} className="text-base font-medium">
          {PANEL_TEXTS.title}
        </h2>
        <IpsButton
          variant="outlined"
          size="small"
          startIcon={<AppIcon name="close" size="small" />}
          disabled={isDisabled || activeFilterCount === 0}
          onClick={onClearFilters}
        >
          {PANEL_TEXTS.clearFilters(activeFilterCount)}
        </IpsButton>
      </div>

      <div className="mt-3 grid grid-cols-6 gap-4">
        <MultiFilterSelect
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
  label: string;
  options: IpsSelectOption[];
  selectedIds: number[];
  isDisabled: boolean;
  hasError?: boolean;
  helperText?: string;
  onChange: (selectedIds: number[]) => void;
}

// בחירה מרובה בלי אפשרות "הכל" מפורשת: בחירה ריקה מוצגת כ"הכל" (pending-decisions)
function MultiFilterSelect({
  label,
  options,
  selectedIds,
  isDisabled,
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
        options={options}
        value={selectedIds}
        placeholder={FILTER_TEXTS.all}
        renderValue={() => buildMultiSelectionSummary(options, selectedIds)}
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
  isDisabled: boolean;
  onChange: (locationIds: number[]) => void;
}

function LocationFilter({ locations, options, selectedLocationIds, isDisabled, onChange }: LocationFilterProps) {
  const fieldState = resolveLocationsFieldState(locations.status);

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <MultiFilterSelect
        label={GROUP_TEXTS.location}
        options={options}
        selectedIds={selectedLocationIds}
        isDisabled={isDisabled || fieldState.isUnavailable}
        hasError={fieldState.hasFailed}
        helperText={fieldState.statusText}
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
