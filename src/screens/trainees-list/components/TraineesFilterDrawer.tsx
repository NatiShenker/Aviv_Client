import { useMemo } from "react";
import {
  IpsButton,
  IpsDrawer,
  IpsMultiSelectMobile,
  IpsPillSelect,
  type IpsMultiSelectMobileValue,
  type IpsSelectOption,
} from "ui-library";
import type { WingDto, WingLocationDto } from "@/schemas/organization.schema";
import type { TraineeListFiltersState } from "@/schemas/trainees.schema";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import { locationsOfSelectedWings } from "../traineesListLogic";
import {
  BALANCE_FILTER_OPTIONS,
  PHONE_EXCEPTION_FILTER_OPTIONS,
  RECIPIENT_MESSAGE_FILTER_OPTIONS,
  TRAINEE_RESTRICTION_FILTER_OPTIONS,
  findOptionValue,
} from "../traineesListOptions";
import { TRAINEES_LIST_TEXTS } from "../traineesListTexts";
import type { TraineeFilterGroupsUpdate } from "../useTraineesListFilters";

const TEXTS = TRAINEES_LIST_TEXTS.filterDrawer;
// גובה לפי התוכן; המגירה מגבילה את עצמה ל-90% מהמסך ומוסיפה גלילה כשצריך
const DRAWER_HEIGHT = "auto";

/** טקסט השדה בבחירה מרובה: שם הפריט כשנבחר אחד, אחרת מספר הנבחרים */
function formatSelection(selectedLabels: string[]): string {
  return selectedLabels.length === 1 ? selectedLabels[0] : TEXTS.selectedCount(selectedLabels.length);
}

function toIds(values: IpsMultiSelectMobileValue[]): number[] {
  return values.map(Number);
}

interface TraineesFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: TraineeListFiltersState;
  wings: WingDto[];
  locations: AsyncResource<WingLocationDto[]>;
  resultCount: number;
  onWingIdsChange: (wingIds: number[]) => void;
  onFiltersChange: (update: TraineeFilterGroupsUpdate) => void;
}

/** מגירת הסינון. כל בחירה מוחלת מיד על הרשימה שמאחוריה (ספק 01 §3.4, §4.3) */
export default function TraineesFilterDrawer({
  open,
  onClose,
  filters,
  wings,
  locations,
  resultCount,
  onWingIdsChange,
  onFiltersChange,
}: TraineesFilterDrawerProps) {
  const wingOptions = useMemo<IpsSelectOption[]>(
    () => wings.map((wing) => ({ value: wing.id, label: TRAINEES_LIST_TEXTS.card.wing(wing.name) })),
    [wings],
  );

  // מיקומי האגפים שנבחרו בלבד (בלי בחירת אגף - כל המיקומים בפנימייה), מקובצים לפי אגף.
  // הקבוצות גם מבדילות בין מיקומים עם אותו שם באגפים שונים
  const locationOptions = useMemo<IpsSelectOption[]>(() => {
    const wingLabelById = new Map(wingOptions.map((option) => [option.value, option.label]));
    return locationsOfSelectedWings(locations.data ?? [], filters.wingIds).map((location) => ({
      value: location.id,
      label: location.name,
      group: wingLabelById.get(location.wingId),
    }));
  }, [locations.data, filters.wingIds, wingOptions]);

  return (
    <IpsDrawer
      open={open}
      anchor="bottom"
      size={DRAWER_HEIGHT}
      title={TEXTS.title}
      closeButtonLabel={TRAINEES_LIST_TEXTS.drawers.close}
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
          onChange={(values) => onWingIdsChange(toIds(values))}
          formatSelection={formatSelection}
        />
        <LocationFilter
          locations={locations}
          options={locationOptions}
          selectedLocationIds={filters.locationIds}
          onChange={(locationIds) => onFiltersChange({ locationIds })}
        />
        <IpsPillSelect
          label={TEXTS.groups.traineeRestriction}
          options={TRAINEE_RESTRICTION_FILTER_OPTIONS}
          value={filters.traineeRestriction}
          allowDeselect={false}
          size="large"
          onChange={(value) => {
            const traineeRestriction = findOptionValue(TRAINEE_RESTRICTION_FILTER_OPTIONS, value);
            if (traineeRestriction) onFiltersChange({ traineeRestriction });
          }}
        />
        <IpsPillSelect
          label={TEXTS.groups.recipientMessage}
          options={RECIPIENT_MESSAGE_FILTER_OPTIONS}
          value={filters.recipientMessage}
          allowDeselect={false}
          size="large"
          onChange={(value) => {
            const recipientMessage = findOptionValue(RECIPIENT_MESSAGE_FILTER_OPTIONS, value);
            if (recipientMessage) onFiltersChange({ recipientMessage });
          }}
        />
        <IpsPillSelect
          label={TEXTS.groups.phoneException}
          options={PHONE_EXCEPTION_FILTER_OPTIONS}
          value={filters.phoneException}
          allowDeselect={false}
          size="large"
          onChange={(value) => {
            const phoneException = findOptionValue(PHONE_EXCEPTION_FILTER_OPTIONS, value);
            if (phoneException) onFiltersChange({ phoneException });
          }}
        />
        <IpsPillSelect
          label={TEXTS.groups.balance}
          options={BALANCE_FILTER_OPTIONS}
          value={filters.balance}
          allowDeselect={false}
          size="large"
          onChange={(value) => {
            const balance = findOptionValue(BALANCE_FILTER_OPTIONS, value);
            if (balance) onFiltersChange({ balance });
          }}
        />
      </div>
    </IpsDrawer>
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
  const isLoading = locations.status === "idle" || locations.status === "loading";
  const hasFailed = locations.status === "error";

  return (
    <div className="flex flex-col gap-1">
      <IpsMultiSelectMobile
        label={TEXTS.groups.location}
        allOptionLabel={TEXTS.all}
        options={options}
        value={selectedLocationIds}
        onChange={(values) => onChange(toIds(values))}
        formatSelection={formatSelection}
        disabled={isLoading || hasFailed}
        error={hasFailed}
        helperText={locationsStatusText(isLoading, hasFailed)}
      />
      {hasFailed && (
        <IpsButton variant="text" size="small" className="self-start" onClick={locations.reload}>
          {TEXTS.retry}
        </IpsButton>
      )}
    </div>
  );
}

function locationsStatusText(isLoading: boolean, hasFailed: boolean): string | undefined {
  if (isLoading) return TEXTS.locationsLoading;
  if (hasFailed) return TEXTS.locationsLoadFailed;
  return undefined;
}
