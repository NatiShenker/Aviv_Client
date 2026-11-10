import type { IpsSelectOption } from "ui-library";
import { buildWingLabel } from "@/features/institutes/organizationLogic";
import type { AsyncStatus } from "@/shared/hooks/useAsyncResource";
import type { WingDto, WingLocationDto } from "@/types/organization.schema";
import { locationsOfSelectedWings } from "./traineesListLogic";
import { TRAINEES_LIST_TEXTS } from "./traineesListTexts";

const TEXTS = TRAINEES_LIST_TEXTS.filters;

export function buildWingFilterOptions(wings: WingDto[]): IpsSelectOption[] {
  return wings.map((wing) => ({ value: wing.wingId, label: buildWingLabel(wing) }));
}

/**
 * מיקומי האגפים שנבחרו בלבד (בלי בחירת אגף - כל המיקומים בפנימייה), מקובצים לפי אגף (parentId).
 * הקבוצות גם מבדילות בין מיקומים עם אותו שם באגפים שונים
 */
export function buildLocationFilterOptions(
  locations: WingLocationDto[],
  selectedWingIds: number[],
  wings: WingDto[],
): IpsSelectOption[] {
  const wingLabelById = new Map(wings.map((wing) => [wing.wingId, buildWingLabel(wing)]));
  return locationsOfSelectedWings(locations, selectedWingIds).map((location) => ({
    value: location.locationId,
    label: location.locationName,
    group: wingLabelById.get(location.parentId),
  }));
}

/** טקסט השדה בבחירה מרובה: שם הפריט כשנבחר אחד, אחרת מספר הנבחרים */
export function formatMultiSelection(selectedLabels: string[]): string {
  return selectedLabels.length === 1 ? selectedLabels[0] : TEXTS.selectedCount(selectedLabels.length);
}

/**
 * טקסט השדה בבחירה מרובה בדסקטופ, שאין בו אפשרות "הכל" מפורשת:
 * בלי בחירה - "הכל", ואחרת כמו במובייל
 */
export function buildMultiSelectionSummary(
  options: IpsSelectOption[],
  selectedValues: ReadonlyArray<string | number>,
): string {
  if (selectedValues.length === 0) {
    return TEXTS.all;
  }
  const selectedLabels = options
    .filter((option) => selectedValues.includes(option.value))
    .map((option) => option.label);
  return formatMultiSelection(selectedLabels);
}

/** הפקד מחזיר את ערכי האפשרויות; המזהים בסינון הם מספרים */
export function toFilterIds(values: ReadonlyArray<string | number>): number[] {
  return values.map(Number);
}

export interface LocationsFieldState {
  /** המיקומים עוד לא הגיעו או שהטעינה נכשלה - השדה מושבת */
  isUnavailable: boolean;
  hasFailed: boolean;
  statusText: string | undefined;
}

/** המיקומים נטענים ברקע, ולכן לשדה יש מצבי טעינה ושגיאה משלו */
export function resolveLocationsFieldState(status: AsyncStatus): LocationsFieldState {
  const isLoading = status === "idle" || status === "loading";
  const hasFailed = status === "error";
  return {
    isUnavailable: isLoading || hasFailed,
    hasFailed,
    statusText: locationsStatusText(isLoading, hasFailed),
  };
}

function locationsStatusText(isLoading: boolean, hasFailed: boolean): string | undefined {
  if (isLoading) return TEXTS.locationsLoading;
  if (hasFailed) return TEXTS.locationsLoadFailed;
  return undefined;
}
