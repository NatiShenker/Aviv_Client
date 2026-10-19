import { useEffect } from "react";
import DesktopInstituteSelector from "@/features/institutes/DesktopInstituteSelector";
import { useInstitutes } from "@/features/institutes/InstitutesProvider";
import InstitutesStateGate from "@/features/institutes/InstitutesStateGate";
import TraineeDrawer from "@/features/trainee-actions/desktop/TraineeDrawer";
import { useTraineeDrawer } from "@/features/trainee-actions/desktop/useTraineeDrawer";
import DesktopPage from "@/shells/desktop/DesktopPage";
import { forgetTraineesListPosition } from "../traineesListMemory";
import { TRAINEES_LIST_TEXTS } from "../traineesListTexts";
import { useTraineesListState } from "../useTraineesListState";
import TraineeCardsGrid from "./TraineeCardsGrid";
import TraineesFiltersPanel from "./TraineesFiltersPanel";
import TraineesResultsToolbar from "./TraineesResultsToolbar";

/** מסך הבית בדסקטופ: רשימת החניכים בפנימייה הנבחרת (ספק 01, פריסת דסקטופ) */
export default function DesktopTraineesListScreen() {
  return (
    <DesktopPage>
      <InstitutesStateGate>
        <DesktopTraineesListContent />
      </InstitutesStateGate>
    </DesktopPage>
  );
}

// עולה רק אחרי שרשימת הפנימיות הגיעה
function DesktopTraineesListContent() {
  const { selectedInstitute } = useInstitutes();
  const { trainees, locations, listFilters } = useTraineesListState(selectedInstitute);
  const areToolsDisabled = trainees.status !== "success";
  const traineeDrawer = useTraineeDrawer();
  // המגירה מציגה את החניך מתוך הרשימה שכבר נטענה
  const drawerTrainee = trainees.data?.find((trainee) => trainee.id === traineeDrawer.drawer?.traineeId) ?? null;

  useEffect(() => {
    forgetTraineesListPosition();
  }, []);

  return (
    <>
      <div className="flex shrink-0 items-center justify-between gap-4">
        <h1 className="text-2xl font-medium">{TRAINEES_LIST_TEXTS.title}</h1>
        {/* הבורר יורש את הגופן והצבע מהעוטף, ורוחבו לפי שם הפנימייה */}
        <div className="min-w-0 max-w-80 text-lg font-medium text-text-primary">
          <DesktopInstituteSelector />
        </div>
      </div>

      {selectedInstitute && (
        <TraineesFiltersPanel
          filters={listFilters.filters}
          wings={selectedInstitute.wings}
          locations={locations}
          activeFilterCount={listFilters.activeFilterCount}
          isDisabled={areToolsDisabled}
          onWingIdsChange={listFilters.setWingIds}
          onFiltersChange={listFilters.updateFilters}
          onClearFilters={listFilters.clearFilters}
        />
      )}

      {/* פאנל התוצאות ממלא את שאר הגובה: הסרגל קבוע, ורק אזור הכרטיסים שמתחתיו גולל */}
      <div className="flex min-h-0 flex-1 flex-col rounded-card bg-paper">
        <TraineesResultsToolbar
          searchQuery={listFilters.filters.searchQuery}
          onSearchQueryChange={listFilters.setSearchQuery}
          resultCount={areToolsDisabled ? null : listFilters.visibleTrainees.length}
          sort={listFilters.sort}
          onSortChange={listFilters.setSort}
          isDisabled={areToolsDisabled}
        />
        <TraineeCardsGrid
          hasSelectedInstitute={selectedInstitute !== null}
          trainees={trainees}
          visibleTrainees={listFilters.visibleTrainees}
          activeTraineeId={traineeDrawer.openTraineeId}
          onOpenTrainee={traineeDrawer.openDrawer}
        />
      </div>

      <TraineeDrawer
        isOpen={traineeDrawer.drawer?.isOpen ?? false}
        openingKey={traineeDrawer.drawer?.openingKey ?? 0}
        trainee={drawerTrainee}
        onClose={traineeDrawer.closeDrawer}
      />
    </>
  );
}
