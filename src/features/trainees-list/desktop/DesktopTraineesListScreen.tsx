import { useEffect } from "react";
import InstitutesStateGate from "@/features/institutes/InstitutesStateGate";
import TraineeDrawer from "@/features/trainee-actions/desktop/TraineeDrawer";
import { ACTIONS_SCREEN } from "@/features/trainee-actions/desktop/traineeDrawerScreens";
import { useTraineeDrawer } from "@/features/trainee-actions/desktop/useTraineeDrawer";
import DesktopInstituteSelector from "@/features/trainees-list/desktop/DesktopInstituteSelector";
import DesktopPage from "@/shells/desktop/DesktopPage";
import { useInstitutes } from "@/store/institutesContext";
import type { WingDto } from "@/types/organization.schema";
import { focusField } from "@/utils/dom";
import { forgetTraineesListPosition } from "../traineesListMemory";
import { TRAINEES_LIST_TEXTS } from "../traineesListTexts";
import { useTraineesListState } from "../useTraineesListState";
import TraineeCardsGrid, { TRAINEE_CARDS_REGION_ID } from "./TraineeCardsGrid";
import TraineesFiltersPanel from "./TraineesFiltersPanel";
import TraineesResultsToolbar from "./TraineesResultsToolbar";

// הפניה קבועה, כדי שרשימה ריקה לא תיחשב "רשימה חדשה" בכל רינדור
const NO_WINGS: WingDto[] = [];

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
  const { trainees, locations, listFilters, isListLoading } = useTraineesListState(selectedInstitute);
  const areToolsDisabled = trainees.status !== "success";
  const traineeDrawer = useTraineeDrawer();
  // המגירה מציגה את החניך מתוך הרשימה שכבר נטענה
  const drawerTrainee =
    trainees.data?.find((trainee) => trainee.idntTrainee === traineeDrawer.drawer?.traineeId) ?? null;

  useEffect(() => {
    forgetTraineesListPosition();
  }, []);

  // בסגירת המגירה הפוקוס חוזר לכרטיס שפתח אותה. אם הכרטיס כבר לא מוצג (למשל זז במיון אחרי שמירה),
  // הפוקוס חוזר לאזור הכרטיסים, כדי שהמקלדת תמשיך מהרשימה ולא מתחילת העמוד
  const keepFocusInList = () => {
    if (document.activeElement === document.body) {
      focusField(TRAINEE_CARDS_REGION_ID);
    }
  };

  return (
    <>
      <div className="flex shrink-0 items-center justify-between gap-4">
        {/* 20/500: דרגה אחת מעל הכותרת במובייל (18), כמו הבורר שלידה (16 במובייל, 18 כאן) */}
        <h1 className="text-xl font-medium">{TRAINEES_LIST_TEXTS.title}</h1>
        {/* הבורר יורש את הגופן והצבע מהעוטף, ורוחבו לפי שם הפנימייה */}
        <div className="min-w-0 max-w-80 text-lg font-medium text-text-primary">
          <DesktopInstituteSelector />
        </div>
      </div>

      {/* גם לפני שנבחרה פנימייה - מושבת, כדי שהתוצאות לא יזוזו כשהיא נבחרת */}
      <TraineesFiltersPanel
        filters={listFilters.filters}
        wings={selectedInstitute?.wings ?? NO_WINGS}
        locations={locations}
        activeFilterCount={listFilters.activeFilterCount}
        hasSelectedInstitute={selectedInstitute !== null}
        isDisabled={areToolsDisabled}
        onWingIdsChange={listFilters.setWingIds}
        onFiltersChange={listFilters.updateFilters}
        onClearFilters={listFilters.clearFilters}
      />

      {/* פאנל התוצאות ממלא את שאר הגובה: הסרגל קבוע, ורק אזור הכרטיסים שמתחתיו גולל */}
      <div className="flex min-h-0 flex-1 flex-col rounded-card bg-paper">
        <TraineesResultsToolbar
          searchQuery={listFilters.filters.searchQuery}
          onSearchQueryChange={listFilters.setSearchQuery}
          resultCount={areToolsDisabled ? null : listFilters.visibleTrainees.length}
          isResultCountLoading={isListLoading}
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
          resetVisibleCountOn={[listFilters.filters, listFilters.sort]}
        />
      </div>

      {/* שמירה במגירה משנה נתונים שהרשימה מציגה (למשל "מוגבל עד"), ולכן הרשימה מתרעננת מיד - בשקט, בלי שלד */}
      <TraineeDrawer
        isOpen={traineeDrawer.drawer?.isOpen ?? false}
        openingKey={traineeDrawer.drawer?.openingKey ?? 0}
        initialScreen={traineeDrawer.drawer?.initialScreen ?? ACTIONS_SCREEN}
        trainee={drawerTrainee}
        onClose={traineeDrawer.closeDrawer}
        onRecordSaved={trainees.refreshInBackground}
        onExited={keepFocusInList}
      />
    </>
  );
}
