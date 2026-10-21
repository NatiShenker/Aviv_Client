import { useId } from "react";
import { IpsButton, IpsMultiSelectMobile, IpsPillSelect, type IpsSelectOption } from "ui-library";
import FieldLabelText from "@/shared/components/form/FieldLabelText";
import { EXPANDED_TOUCH_TARGET_SX } from "@/shared/components/touchTarget";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import BottomSheet from "@/shells/mobile/BottomSheet";
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

// "ניקוי מסננים" היא פעולה משנית: 14/500, קטנה מכותרת המגירה (18) ובגודל כפתורי הבחירה (14).
// כפתורי הטקסט של הספרייה הם 16, ולכן הגודל מותאם כאן, במקום השימוש
const CLEAR_FILTERS_BUTTON_SX = {
  fontSize: "14px",
  fontWeight: 500,
  ...EXPANDED_TOUCH_TARGET_SX,
} as const;

// בחירה פעילה ברשימת החניכים בנייבי, כמו בסקיצה (ספק 00 §2.1), כך ש"הצגת התוצאות" נשאר הכחול היחיד במגירה.
// IpsPillSelect צובע לפי ה-primary; ההתאמה כאן, במקום השימוש, והפקד בספרייה לא משתנה
const NAVY_PILLS_SX = {
  '& .ips-pill[aria-pressed="true"]': {
    bgcolor: "text.primary",
    borderColor: "text.primary",
    color: "common.white",
    "&:hover": { bgcolor: "text.primary", borderColor: "text.primary" },
  },
  '& .ips-pill[aria-pressed="false"]': {
    bgcolor: "background.paper",
    borderColor: "grey.300",
    color: "text.primary",
    "&:hover": { bgcolor: "grey.50" },
  },
} as const;

interface TraineesFilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: TraineeListFiltersState;
  wings: WingDto[];
  locations: AsyncResource<WingLocationDto[]>;
  /** כמה מקבוצות הסינון פעילות. בלי סינון פעיל "ניקוי מסננים" מושבת */
  activeFilterCount: number;
  onWingIdsChange: (wingIds: number[]) => void;
  onFiltersChange: (update: TraineeFilterGroupsUpdate) => void;
  /** מאפס את שש הקבוצות, כולל האגף השמור; לא את החיפוש והמיון (כמו בדסקטופ, ספק 01 §8.2) */
  onClearFilters: () => void;
}

/** גיליון הסינון. כל בחירה מוחלת מיד על הרשימה שמאחוריו (ספק 01 §3.4, §4.3) */
export default function TraineesFilterSheet({
  open,
  onClose,
  filters,
  wings,
  locations,
  activeFilterCount,
  onWingIdsChange,
  onFiltersChange,
  onClearFilters,
}: TraineesFilterSheetProps) {
  const { wingOptions, locationOptions } = useTraineeFilterOptions(wings, locations.data, filters.wingIds);

  return (
    <BottomSheet
      open={open}
      title={TEXTS.title}
      onClose={onClose}
      actions={
        <IpsButton variant="contained" size="large" fullWidth onClick={onClose}>
          {TEXTS.showResults}
        </IpsButton>
      }
    >
      {/* מושבת ולא מוסתר כשאין סינון, כדי שהתוכן לא יקפוץ ברגע שבוחרים את הסינון הראשון */}
      <div className="flex justify-end">
        <IpsButton
          variant="text"
          size="small"
          disabled={activeFilterCount === 0}
          onClick={onClearFilters}
          sx={CLEAR_FILTERS_BUTTON_SX}
        >
          {TRAINEES_LIST_TEXTS.filterPanel.clearFilters}
        </IpsButton>
      </div>

      <div className="mt-2 flex flex-col gap-6">
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
    </BottomSheet>
  );
}

interface PillFilterProps<TValue extends string> {
  label: string;
  options: FilterOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
}

/**
 * בחירה יחידה מתוך אפשרויות קבועות, ו"הכל" היא אחת מהן - ולכן תמיד נשארת בחירה (כמו FilterSelect בדסקטופ).
 * התווית נבנית כאן ולא ב-label של IpsPillSelect, כדי שתהיה כמו התוויות של שאר השדות במגירה (12)
 */
function PillFilter<TValue extends string>({ label, options, value, onChange }: PillFilterProps<TValue>) {
  const labelId = useId();

  const handleChange = (selectedValue: unknown) => {
    const optionValue = findOptionValue(options, selectedValue);
    if (optionValue) {
      onChange(optionValue);
    }
  };

  return (
    <div role="group" aria-labelledby={labelId}>
      <FieldLabelText id={labelId} text={label} />
      <IpsPillSelect
        options={options}
        value={value}
        allowDeselect={false}
        size="large"
        onChange={handleChange}
        sx={NAVY_PILLS_SX}
      />
    </div>
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
        <IpsButton
          variant="text"
          size="small"
          className="self-start"
          onClick={locations.reload}
          sx={EXPANDED_TOUCH_TARGET_SX}
        >
          {TEXTS.retry}
        </IpsButton>
      )}
    </div>
  );
}
