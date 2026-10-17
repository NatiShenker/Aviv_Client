import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SELECTION_TTL_DAYS } from "@/constants/appConstants";
import { readWithExpiry, saveWithExpiry } from "@/infrastructure/storage/expiringStorage";
import { STORAGE_KEYS } from "@/infrastructure/storage/storageKeys";
import type { InstituteWithWingsDto, WingLocationDto } from "@/schemas/organization.schema";
import type { TraineeListFiltersState, TraineeListItemDto } from "@/schemas/trainees.schema";
import { readRememberedTraineesList, rememberTraineesListView } from "./traineesListMemory";
import { filterAndSortTrainees, hasActiveFilters, keepLocationsOfWings } from "./traineesListLogic";
import {
  DEFAULT_TRAINEE_FILTERS,
  DEFAULT_TRAINEE_SORT_OPTION,
  findSortOption,
  type TraineeSortOption,
} from "./traineesListOptions";

/** קבוצות הסינון שמתעדכנות ישירות (בלי שמירה ובלי תלות באחרות) */
export type TraineeFilterGroupsUpdate = Partial<
  Pick<TraineeListFiltersState, "locationIds" | "traineeRestriction" | "recipientMessage" | "phoneException" | "balance">
>;

interface TraineesListFilters {
  filters: TraineeListFiltersState;
  sort: TraineeSortOption;
  visibleTrainees: TraineeListItemDto[];
  isFilterActive: boolean;
  setSearchQuery: (searchQuery: string) => void;
  setWingIds: (wingIds: number[]) => void;
  updateFilters: (update: TraineeFilterGroupsUpdate) => void;
  setSort: (sort: TraineeSortOption) => void;
}

/**
 * מצב החיפוש, הסינון והמיון של המסך, והרשימה שנגזרת מהם. הכל מקומי, בלי פנייה לסרביס.
 * המצב נשמר בזכרון, כך שחזרה למסך ממסך אחר משחזרת אותו (ספק 01 §2).
 */
export function useTraineesListFilters(
  trainees: TraineeListItemDto[],
  institute: InstituteWithWingsDto | null,
  locations: WingLocationDto[],
): TraineesListFilters {
  const [filters, setFilters] = useState<TraineeListFiltersState>(() => initialFiltersFor(institute));
  const [sort, setSort] = useState<TraineeSortOption>(() => initialSortFor(institute));
  // הפנימייה שהמצב הנוכחי שייך אליה. כך שחזרה למסך לא נחשבת "החלפת פנימייה"
  const stateInstituteIdRef = useRef(institute?.id ?? null);

  // החלפת פנימייה: החיפוש, הסינונים והמיון מתחילים מחדש, וסינון האגף ששמור לפנימייה משוחזר
  useEffect(() => {
    const instituteId = institute?.id ?? null;
    if (stateInstituteIdRef.current === instituteId) return;
    stateInstituteIdRef.current = instituteId;
    setFilters(initialFiltersFor(institute));
    setSort(initialSortFor(institute));
  }, [institute]);

  useEffect(() => {
    if (institute) {
      rememberTraineesListView(institute.id, filters, sort.key);
    }
  }, [institute, filters, sort]);

  const setSearchQuery = useCallback((searchQuery: string) => {
    setFilters((current) => ({ ...current, searchQuery }));
  }, []);

  // בחירת אגף מצמצמת את המיקומים: מיקום שלא שייך לאגפים שנבחרו יוצא מהבחירה
  const setWingIds = useCallback(
    (wingIds: number[]) => {
      setFilters((current) => ({
        ...current,
        wingIds,
        locationIds: keepLocationsOfWings(current.locationIds, locations, wingIds),
      }));
      if (institute) {
        storeWingIds(institute.id, wingIds);
      }
    },
    [institute, locations],
  );

  const updateFilters = useCallback((update: TraineeFilterGroupsUpdate) => {
    setFilters((current) => ({ ...current, ...update }));
  }, []);

  const visibleTrainees = useMemo(
    () => filterAndSortTrainees(trainees, filters, sort),
    [trainees, filters, sort],
  );

  return {
    filters,
    sort,
    visibleTrainees,
    isFilterActive: hasActiveFilters(filters),
    setSearchQuery,
    setWingIds,
    updateFilters,
    setSort,
  };
}

// ── המצב ההתחלתי: מה שנשמר בזכרון לפנימייה הזו, ואם אין - ברירות המחדל עם סינון האגף השמור ──

function initialFiltersFor(institute: InstituteWithWingsDto | null): TraineeListFiltersState {
  if (!institute) {
    return DEFAULT_TRAINEE_FILTERS;
  }
  const remembered = readRememberedTraineesList(institute.id);
  if (remembered) {
    return remembered.filters;
  }
  return { ...DEFAULT_TRAINEE_FILTERS, wingIds: readStoredWingIds(institute) };
}

function initialSortFor(institute: InstituteWithWingsDto | null): TraineeSortOption {
  const remembered = institute ? readRememberedTraineesList(institute.id) : null;
  return remembered ? findSortOption(remembered.sortKey) : DEFAULT_TRAINEE_SORT_OPTION;
}

// ── שמירת סינון האגף (30 יום), יחד עם הפנימייה שאליה הוא שייך ──

interface StoredWingFilter {
  instituteId: number;
  wingIds: number[];
}

function isStoredWingFilter(value: unknown): value is StoredWingFilter {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<StoredWingFilter>;
  return (
    typeof candidate.instituteId === "number" &&
    Array.isArray(candidate.wingIds) &&
    candidate.wingIds.every((wingId) => typeof wingId === "number")
  );
}

/** משוחזר רק אם נשמר לאותה פנימייה, ורק אגפים שעדיין קיימים בה */
function readStoredWingIds(institute: InstituteWithWingsDto): number[] {
  const stored = readWithExpiry(STORAGE_KEYS.traineesWingFilter, isStoredWingFilter);
  if (!stored || stored.instituteId !== institute.id) {
    return [];
  }
  const existingWingIds = new Set(institute.wings.map((wing) => wing.id));
  return stored.wingIds.filter((wingId) => existingWingIds.has(wingId));
}

/** נשמר בכל בחירה של המשתמש, והתוקף מתחדש */
function storeWingIds(instituteId: number, wingIds: number[]): void {
  const entry: StoredWingFilter = { instituteId, wingIds };
  saveWithExpiry(STORAGE_KEYS.traineesWingFilter, entry, SELECTION_TTL_DAYS);
}
