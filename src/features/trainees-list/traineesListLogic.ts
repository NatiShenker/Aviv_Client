import { HEBREW_LOCALE } from "@/config/appConstants";
import { INSTITUTES_TEXTS } from "@/features/institutes/institutesTexts";
import { formatPersonalNumber } from "@/features/trainee/traineeDisplay";
import type { WingLocationDto } from "@/types/organization.schema";
import type { TraineeListFiltersState, TraineeListItemDto, TraineeSortField } from "@/types/trainees.schema";
import type { TraineeSortOption } from "./traineesListOptions";
import { TRAINEES_LIST_TEXTS } from "./traineesListTexts";

/** המיקום שמוצג בכרטיס: "אגף X", ואחריו המיקום באגף כשיש */
export function buildTraineeLocationLabel(trainee: TraineeListItemDto): string {
  const wingLabel = INSTITUTES_TEXTS.organization.wing(trainee.wing.name);
  if (!trainee.location) {
    return wingLabel;
  }
  return `${wingLabel}${TRAINEES_LIST_TEXTS.card.locationSeparator}${trainee.location.name}`;
}

/** כמה מקבוצות הסינון אינן על "הכל" (החיפוש לא נחשב סינון) */
export function countActiveFilterGroups(filters: TraineeListFiltersState): number {
  const activeGroups = [
    filters.wingIds.length > 0,
    filters.locationIds.length > 0,
    filters.traineeRestriction !== "all",
    filters.recipientMessage !== "all",
    filters.phoneException !== "all",
    filters.balance !== "all",
  ];
  return activeGroups.filter(Boolean).length;
}

/** המיקומים שאפשר לבחור: של האגפים שנבחרו, או כל המיקומים כשלא נבחר אגף */
export function locationsOfSelectedWings(
  locations: WingLocationDto[],
  selectedWingIds: number[],
): WingLocationDto[] {
  if (selectedWingIds.length === 0) {
    return locations;
  }
  return locations.filter((location) => selectedWingIds.includes(location.parentId));
}

/** משאיר בבחירה רק מיקומים ששייכים לאגפים שנבחרו */
export function keepLocationsOfWings(
  selectedLocationIds: number[],
  locations: WingLocationDto[],
  selectedWingIds: number[],
): number[] {
  const availableLocationIds = new Set(
    locationsOfSelectedWings(locations, selectedWingIds).map((location) => location.locationId),
  );
  return selectedLocationIds.filter((locationId) => availableLocationIds.has(locationId));
}

/** לחניך יש הגבלה פעילה לחניך - התגית "מוגבל עד" בכרטיס (OQ-03) */
export function isTraineeRestricted(trainee: TraineeListItemDto): boolean {
  return trainee.dateRestrictedUntil !== null;
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
      return bySortField !== 0 ? bySortField : compareHebrew(first.textFullName, second.textFullName);
    });
}

/** החניך עונה על החיפוש ועל כל קבוצות הסינון שנבחרו */
function matchesTraineeFilters(
  trainee: TraineeListItemDto,
  filters: TraineeListFiltersState,
): boolean {
  const { flags } = trainee;

  // 1. חיפוש טקסטואלי (שם או מספר אישי)
  const q = filters.searchQuery.trim();
  if (q && !trainee.textFullName.includes(q) && !formatPersonalNumber(trainee.numbPersonalNumber).includes(q)) {
    return false;
  }

  // 2. סינון אגף ומיקום באגף
  if (filters.wingIds.length > 0 && !filters.wingIds.includes(trainee.wing.id)) {
    return false;
  }
  if (
    filters.locationIds.length > 0 &&
    (!trainee.location || !filters.locationIds.includes(trainee.location.id))
  ) {
    return false;
  }

  // 3. c. סינון לפי הגבלה לחניך
  if (filters.traineeRestriction === "full" && !flags.hasActiveFullRestriction) return false;
  if (filters.traineeRestriction === "minutes" && !flags.hasActiveMinutesRestriction) return false;
  if (
    filters.traineeRestriction === "none" &&
    (flags.hasActiveFullRestriction || flags.hasActiveMinutesRestriction)
  ) {
    return false;
  }

  // 4. d. סינון לפי הודעה לנמען
  if (filters.recipientMessage === "regular" && !flags.hasActiveMessage) return false;
  if (filters.recipientMessage === "interactive" && !flags.hasActiveInteractiveMessage) return false;
  if (
    filters.recipientMessage === "none" &&
    (flags.hasActiveMessage || flags.hasActiveInteractiveMessage)
  ) {
    return false;
  }

  // 5. e. סינון לפי הגבלות והיתרים למספר
  if (filters.phoneException === "restriction" && !flags.hasActivePhoneRestriction) return false;
  if (filters.phoneException === "permit" && !flags.hasActivePhonePermit) return false;
  if (
    filters.phoneException === "none" &&
    (flags.hasActivePhoneRestriction || flags.hasActivePhonePermit)
  ) {
    return false;
  }

  // 6. f. סינון לפי יתרה
  if (filters.balance === "has_balance" && !flags.hasBalance) return false;
  if (filters.balance === "no_balance" && flags.hasBalance) return false;

  return true;
}

function compareTraineesBy(field: TraineeSortField, first: TraineeListItemDto, second: TraineeListItemDto): number {
  switch (field) {
    case "name":
      return compareHebrew(first.textFullName, second.textFullName);
    case "status":
      return Number(isTraineeRestricted(first)) - Number(isTraineeRestricted(second));
    case "minutes":
      return first.numbRemainingMinutes - second.numbRemainingMinutes;
    case "wing":
      return compareHebrew(first.wing.name, second.wing.name);
    case "location":
      return compareHebrew(first.location?.name ?? "", second.location?.name ?? "");
  }
}

function compareHebrew(first: string, second: string): number {
  return first.localeCompare(second, HEBREW_LOCALE);
}
