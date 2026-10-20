import { useState } from "react";
import InstitutesStateGate from "@/features/institutes/InstitutesStateGate";
import AppPage from "@/shells/mobile/AppPage";
import { useWindowScrollRestoration } from "@/shells/mobile/navigation/useWindowScrollRestoration";
import PinnedPageTop from "@/shells/mobile/PinnedPageTop";
import { useInstitutes } from "@/store/institutesContext";
import { readRememberedTraineesList, rememberTraineesListPosition } from "../traineesListMemory";
import { useTraineesListState } from "../useTraineesListState";
import TraineesFilterDrawer from "./TraineesFilterDrawer";
import TraineesList from "./TraineesList";
import TraineesListHeader from "./TraineesListHeader";
import TraineesSortDrawer from "./TraineesSortDrawer";

type OpenDrawer = "filter" | "sort" | null;

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
  const [openDrawer, setOpenDrawer] = useState<OpenDrawer>(null);

  // המיקום ברשימה כפי שהיה כשעזבו את המסך: נקרא פעם אחת, כשהמסך עולה
  const [restoredPosition] = useState(() =>
    selectedInstitute ? readRememberedTraineesList(selectedInstitute.id) : null,
  );
  useWindowScrollRestoration(restoredPosition?.scrollY ?? null, trainees.status === "success", (scrollY) =>
    rememberTraineesListPosition({ scrollY }),
  );

  const closeDrawer = () => setOpenDrawer(null);

  return (
    <>
      <PinnedPageTop>
        <TraineesListHeader
          searchQuery={listFilters.filters.searchQuery}
          onSearchQueryChange={listFilters.setSearchQuery}
          isFilterActive={listFilters.isFilterActive}
          areToolsDisabled={trainees.status !== "success"}
          onFilterClick={() => setOpenDrawer("filter")}
          onSortClick={() => setOpenDrawer("sort")}
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
        <TraineesFilterDrawer
          open={openDrawer === "filter"}
          onClose={closeDrawer}
          filters={listFilters.filters}
          wings={selectedInstitute.wings}
          locations={locations}
          resultCount={listFilters.visibleTrainees.length}
          onWingIdsChange={listFilters.setWingIds}
          onFiltersChange={listFilters.updateFilters}
        />
      )}

      <TraineesSortDrawer
        open={openDrawer === "sort"}
        onClose={closeDrawer}
        sort={listFilters.sort}
        onSortChange={listFilters.setSort}
      />
    </>
  );
}
