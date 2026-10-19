import { useState } from "react";
import { useInstitutes } from "@/features/institutes/InstitutesProvider";
import InstitutesStateGate from "@/features/institutes/InstitutesStateGate";
import type { WingLocationDto } from "@/schemas/organization.schema";
import type { TraineeListItemDto } from "@/schemas/trainees.schema";
import AppPage from "@/shells/mobile/AppPage";
import { useWindowScrollRestoration } from "@/shells/mobile/hooks/useWindowScrollRestoration";
import PinnedPageTop from "@/shells/mobile/PinnedPageTop";
import TraineesFilterDrawer from "./components/TraineesFilterDrawer";
import TraineesList from "./components/TraineesList";
import TraineesListHeader from "./components/TraineesListHeader";
import TraineesSortDrawer from "./components/TraineesSortDrawer";
import { readRememberedTraineesList, rememberTraineesListPosition } from "./traineesListMemory";
import { useTraineesListData } from "./useTraineesListData";
import { useTraineesListFilters } from "./useTraineesListFilters";

type OpenDrawer = "filter" | "sort" | null;

// הפניות קבועות, כדי שרשימה ריקה לא תיחשב "רשימה חדשה" בכל רינדור
const NO_TRAINEES: TraineeListItemDto[] = [];
const NO_LOCATIONS: WingLocationDto[] = [];

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
  const { trainees, locations } = useTraineesListData(selectedInstitute);
  const listFilters = useTraineesListFilters(
    trainees.data ?? NO_TRAINEES,
    selectedInstitute,
    locations.data ?? NO_LOCATIONS,
  );
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
