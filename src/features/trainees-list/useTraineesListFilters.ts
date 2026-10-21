import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { InstituteWithWingsDto, WingLocationDto } from "@/types/organization.schema";
import type { TraineeListFiltersState, TraineeListItemDto } from "@/types/trainees.schema";
import { countActiveFilterGroups, filterAndSortTrainees, keepLocationsOfWings } from "./traineesListLogic";
import { readRememberedTraineesList, rememberTraineesListView } from "./traineesListMemory";
import {
  DEFAULT_TRAINEE_FILTERS,
  DEFAULT_TRAINEE_SORT_OPTION,
  findSortOption,
  type TraineeSortOption,
} from "./traineesListOptions";
import { readStoredWingIds, storeWingIds } from "./wingFilterSelection";

/** קבוצות הסינון שמתעדכנות ישירות (ללא שמירה וללא תלות באחרות) */
export type TraineeFilterGroupsUpdate = Partial<
  Pick<TraineeListFiltersState, "locationIds" | "traineeRestriction" | "recipientMessage" | "phoneException" | "balance">
>;

export interface TraineesListFilters {
  filters: TraineeListFiltersState;
  sort: TraineeSortOption;
  visibleTrainees: TraineeListItemDto[];
  isFilterActive: boolean;
  /** כמה מקבוצות הסינון פעילות (בלי סינון פעיל "ניקוי מסננים" מושבת) */
  activeFilterCount: number;
  setSearchQuery: (searchQuery: string) => void;
  setWingIds: (wingIds: number[]) => void;
  updateFilters: (update: TraineeFilterGroupsUpdate) => void;
  clearFilters: () => void;
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

  // כל קבוצות הסינון חוזרות ל"הכל", כולל האגף השמור. החיפוש והמיון לא משתנים
  const clearFilters = useCallback(() => {
    setFilters((current) => ({ ...DEFAULT_TRAINEE_FILTERS, searchQuery: current.searchQuery }));
    if (institute) {
      storeWingIds(institute.id, []);
    }
  }, [institute]);

  const visibleTrainees = useMemo(
    () => filterAndSortTrainees(trainees, filters, sort),
    [trainees, filters, sort],
  );

  const activeFilterCount = countActiveFilterGroups(filters);

  return {
    filters,
    sort,
    visibleTrainees,
    isFilterActive: activeFilterCount > 0,
    activeFilterCount,
    setSearchQuery,
    setWingIds,
    updateFilters,
    clearFilters,
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
