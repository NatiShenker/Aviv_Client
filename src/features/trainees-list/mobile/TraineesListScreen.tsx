import { useState } from "react";
import InstitutesStateGate from "@/features/institutes/InstitutesStateGate";
import AppPage from "@/shells/mobile/AppPage";
import { useWindowScrollRestoration } from "@/shells/mobile/navigation/useWindowScrollRestoration";
import PinnedPageTop from "@/shells/mobile/PinnedPageTop";
import { useInstitutes } from "@/store/institutesContext";
import { readRememberedTraineesList, rememberTraineesListPosition } from "../traineesListMemory";
import { useTraineesListState } from "../useTraineesListState";
import TraineesFilterSheet from "./TraineesFilterSheet";
import TraineesList from "./TraineesList";
import TraineesListHeader from "./TraineesListHeader";
import TraineesSortSheet from "./TraineesSortSheet";

type OpenSheet = "filter" | "sort" | null;

/** מסך הבית: רשימת החניכים בפנימייה הנבחרת (ספק 01) */
export default function TraineesListScreen() {
  return (
    <AppPage className="pb-10">
      <InstitutesStateGate>
        <TraineesListContent />
      </InstitutesStateGate>
    </AppPage>
  );
}

// עולה רק אחרי שרשימת הפנימיות הגיעה
function TraineesListContent() {
  const { selectedInstitute } = useInstitutes();
  const { trainees, locations, listFilters } = useTraineesListState(selectedInstitute);
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);

  // המיקום ברשימה כפי שהיה כשעזבו את המסך: נקרא פעם אחת, כשהמסך עולה
  const [restoredPosition] = useState(() =>
    selectedInstitute ? readRememberedTraineesList(selectedInstitute.id) : null,
  );
  useWindowScrollRestoration(restoredPosition?.scrollY ?? null, trainees.status === "success", (scrollY) =>
    rememberTraineesListPosition({ scrollY }),
  );

  const closeSheet = () => setOpenSheet(null);

  return (
    <>
      <PinnedPageTop>
        <TraineesListHeader
          searchQuery={listFilters.filters.searchQuery}
          onSearchQueryChange={listFilters.setSearchQuery}
          isFilterActive={listFilters.isFilterActive}
          areToolsDisabled={trainees.status !== "success"}
          resultCount={trainees.status === "success" ? listFilters.visibleTrainees.length : null}
          onFilterClick={() => setOpenSheet("filter")}
          onSortClick={() => setOpenSheet("sort")}
        />
      </PinnedPageTop>

      <TraineesList
        hasSelectedInstitute={selectedInstitute !== null}
        trainees={trainees}
        visibleTrainees={listFilters.visibleTrainees}
        restoredVisibleCount={restoredPosition?.visibleCount ?? null}
        onVisibleCountChange={(visibleCount) => rememberTraineesListPosition({ visibleCount })}
      />

      {selectedInstitute && (
        <TraineesFilterSheet
          open={openSheet === "filter"}
          onClose={closeSheet}
          filters={listFilters.filters}
          wings={selectedInstitute.wings}
          locations={locations}
          resultCount={listFilters.visibleTrainees.length}
          activeFilterCount={listFilters.activeFilterCount}
          onWingIdsChange={listFilters.setWingIds}
          onFiltersChange={listFilters.updateFilters}
          onClearFilters={listFilters.clearFilters}
        />
      )}

      <TraineesSortSheet
        open={openSheet === "sort"}
        onClose={closeSheet}
        sort={listFilters.sort}
        onSortChange={listFilters.setSort}
      />
    </>
  );
}
