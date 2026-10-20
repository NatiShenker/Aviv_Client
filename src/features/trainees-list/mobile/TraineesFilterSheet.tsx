import {
  IpsButton,
  IpsDrawer,
  IpsMultiSelectMobile,
  IpsPillSelect,
  type IpsSelectOption,
} from "ui-library";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { WingDto, WingLocationDto } from "@/types/organization.schema";
import type { TraineeListFiltersState } from "@/types/trainees.schema";
import { formatMultiSelection, resolveLocationsFieldState, toFilterIds } from "../traineesFilterFieldsLogic";
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

const TEXTS = TRAINEES_LIST_TEXTS.filters;
// גובה לפי התוכן; הגיליון מגביל את עצמו ל-90% מהמסך ומוסיף גלילה כשצריך
const SHEET_HEIGHT = "auto";

interface TraineesFilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: TraineeListFiltersState;
  wings: WingDto[];
  locations: AsyncResource<WingLocationDto[]>;
  resultCount: number;
  onWingIdsChange: (wingIds: number[]) => void;
  onFiltersChange: (update: TraineeFilterGroupsUpdate) => void;
}

/** גיליון הסינון. כל בחירה מוחלת מיד על הרשימה שמאחוריו (ספק 01 §3.4, §4.3) */
export default function TraineesFilterSheet({
  open,
  onClose,
  filters,
  wings,
  locations,
  resultCount,
  onWingIdsChange,
  onFiltersChange,
}: TraineesFilterSheetProps) {
  const { wingOptions, locationOptions } = useTraineeFilterOptions(wings, locations.data, filters.wingIds);

  return (
    <IpsDrawer
      open={open}
      anchor="bottom"
      size={SHEET_HEIGHT}
      title={TEXTS.title}
      closeButtonLabel={TRAINEES_LIST_TEXTS.sheets.close}
      onClose={onClose}
      rtl
      actions={
        <IpsButton variant="contained" size="large" fullWidth onClick={onClose}>
          {TEXTS.showResults(resultCount)}
        </IpsButton>
      }
    >
      <div className="flex flex-col gap-6">
        <IpsMultiSelectMobile
          label={TEXTS.groups.wing}
          allOptionLabel={TEXTS.all}
          options={wingOptions}
          value={filters.wingIds}
          onChange={(values) => onWingIdsChange(toFilterIds(values))}
          formatSelection={formatMultiSelection}
        />
        <LocationFilter
          locations={locations}
          options={locationOptions}
          selectedLocationIds={filters.locationIds}
          onChange={(locationIds) => onFiltersChange({ locationIds })}
        />
        <PillFilter
          label={TEXTS.groups.traineeRestriction}
          options={TRAINEE_RESTRICTION_FILTER_OPTIONS}
          value={filters.traineeRestriction}
          onChange={(traineeRestriction) => onFiltersChange({ traineeRestriction })}
        />
        <PillFilter
          label={TEXTS.groups.recipientMessage}
          options={RECIPIENT_MESSAGE_FILTER_OPTIONS}
          value={filters.recipientMessage}
          onChange={(recipientMessage) => onFiltersChange({ recipientMessage })}
        />
        <PillFilter
          label={TEXTS.groups.phoneException}
          options={PHONE_EXCEPTION_FILTER_OPTIONS}
          value={filters.phoneException}
          onChange={(phoneException) => onFiltersChange({ phoneException })}
        />
        <PillFilter
          label={TEXTS.groups.balance}
          options={BALANCE_FILTER_OPTIONS}
          value={filters.balance}
          onChange={(balance) => onFiltersChange({ balance })}
        />
      </div>
    </IpsDrawer>
  );
}

interface PillFilterProps<TValue extends string> {
  label: string;
  options: FilterOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
}

// בחירה יחידה מתוך אפשרויות קבועות, ו"הכל" היא אחת מהן - ולכן תמיד נשארת בחירה (כמו FilterSelect בדסקטופ)
function PillFilter<TValue extends string>({ label, options, value, onChange }: PillFilterProps<TValue>) {
  const handleChange = (selectedValue: unknown) => {
    const optionValue = findOptionValue(options, selectedValue);
    if (optionValue) {
      onChange(optionValue);
    }
  };

  return (
    <IpsPillSelect
      label={label}
      options={options}
      value={value}
      allowDeselect={false}
      size="large"
      onChange={handleChange}
    />
  );
}

interface LocationFilterProps {
  /** המיקומים נטענים ברקע, ולכן לשדה יש מצבי טעינה ושגיאה משלו */
  locations: AsyncResource<WingLocationDto[]>;
  options: IpsSelectOption[];
  selectedLocationIds: number[];
  onChange: (locationIds: number[]) => void;
}

function LocationFilter({ locations, options, selectedLocationIds, onChange }: LocationFilterProps) {
  const fieldState = resolveLocationsFieldState(locations.status);

  return (
    <div className="flex flex-col gap-1">
      <IpsMultiSelectMobile
        label={TEXTS.groups.location}
        allOptionLabel={TEXTS.all}
        options={options}
        value={selectedLocationIds}
        onChange={(values) => onChange(toFilterIds(values))}
        formatSelection={formatMultiSelection}
        disabled={fieldState.isUnavailable}
        error={fieldState.hasFailed}
        helperText={fieldState.statusText}
      />
      {fieldState.hasFailed && (
        <IpsButton variant="text" size="small" className="self-start" onClick={locations.reload}>
          {TEXTS.retry}
        </IpsButton>
      )}
    </div>
  );
}
