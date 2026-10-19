import { HEBREW_LOCALE } from "@/appConstants";
import { ORGANIZATION_TEXTS } from "@/features/institutes/organizationTexts";
import type { WingLocationDto } from "@/schemas/organization.schema";
import {
  matchesTraineeFilters,
  type TraineeListFiltersState,
  type TraineeListItemDto,
  type TraineeSortField,
} from "@/schemas/trainees.schema";
import type { TraineeSortOption } from "./traineesListOptions";
import { TRAINEES_LIST_TEXTS } from "./traineesListTexts";

/** המיקום שמוצג בכרטיס: "אגף X", ואחריו המיקום באגף כשיש */
export function buildTraineeLocationLabel(trainee: TraineeListItemDto): string {
  const wingLabel = ORGANIZATION_TEXTS.wing(trainee.wing.name);
  if (!trainee.location) {
    return wingLabel;
  }
  return `${wingLabel}${TRAINEES_LIST_TEXTS.card.locationSeparator}${trainee.location.name}`;
}

/** האם קבוצת סינון כלשהי אינה על "הכל" (החיפוש לא נחשב סינון) */
export function hasActiveFilters(filters: TraineeListFiltersState): boolean {
  return (
    filters.wingIds.length > 0 ||
    filters.locationIds.length > 0 ||
    filters.traineeRestriction !== "all" ||
    filters.recipientMessage !== "all" ||
    filters.phoneException !== "all" ||
    filters.balance !== "all"
  );
}

/** המיקומים שאפשר לבחור: של האגפים שנבחרו, או כל המיקומים כשלא נבחר אגף */
export function locationsOfSelectedWings(
  locations: WingLocationDto[],
  selectedWingIds: number[],
): WingLocationDto[] {
  if (selectedWingIds.length === 0) {
    return locations;
  }
  return locations.filter((location) => selectedWingIds.includes(location.wingId));
}

/** משאיר בבחירה רק מיקומים ששייכים לאגפים שנבחרו */
export function keepLocationsOfWings(
  selectedLocationIds: number[],
  locations: WingLocationDto[],
  selectedWingIds: number[],
): number[] {
  const availableLocationIds = new Set(
    locationsOfSelectedWings(locations, selectedWingIds).map((location) => location.id),
  );
  return selectedLocationIds.filter((locationId) => availableLocationIds.has(locationId));
}

/** לחניך יש הגבלה פעילה לחניך - התגית "מוגבל עד" בכרטיס (OQ-03) */
export function isTraineeRestricted(trainee: TraineeListItemDto): boolean {
  return Boolean(trainee.restrictedUntilDate);
}

export function filterAndSortTrainees(
  trainees: TraineeListItemDto[],
  filters: TraineeListFiltersState,
  sort: TraineeSortOption,
): TraineeListItemDto[] {
  const directionFactor = sort.direction === "asc" ? 1 : -1;
  return trainees
    .filter((trainee) => matchesTraineeFilters(trainee, filters))
    .sort((first, second) => {
      const bySortField = directionFactor * compareTraineesBy(sort.field, first, second);
      // בשוויון - לפי השם, תמיד מא׳ עד ת׳
      return bySortField !== 0 ? bySortField : compareHebrew(first.fullName, second.fullName);
    });
}

function compareTraineesBy(field: TraineeSortField, first: TraineeListItemDto, second: TraineeListItemDto): number {
  switch (field) {
    case "name":
      return compareHebrew(first.fullName, second.fullName);
    case "status":
      return Number(isTraineeRestricted(first)) - Number(isTraineeRestricted(second));
    case "minutes":
      return first.remainingMinutes - second.remainingMinutes;
    case "wing":
      return compareHebrew(first.wing.name, second.wing.name);
    case "location":
      return compareHebrew(first.location?.name ?? "", second.location?.name ?? "");
  }
}

function compareHebrew(first: string, second: string): number {
  return first.localeCompare(second, HEBREW_LOCALE);
}
