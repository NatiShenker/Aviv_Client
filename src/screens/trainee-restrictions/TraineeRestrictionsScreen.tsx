import PermissionBlockedMessage from "@/context/institutes/PermissionBlockedMessage";
import { PERMISSION_IDS } from "@/context/institutes/permissionIds";
import { usePermissionCheck } from "@/context/institutes/usePermissionCheck";
import AppPage from "@/shared/components/AppPage";
import HistorySkeleton from "@/shared/components/history/HistorySkeleton";
import PageHeader from "@/shared/components/PageHeader";
import PinnedPageTop from "@/shared/components/PinnedPageTop";
import ScreenStateMessage from "@/shared/components/ScreenStateMessage";
import { useScrollToTopOnOpen } from "@/shared/hooks/useScrollToTopOnOpen";
import { TRAINEE_TEXTS } from "@/shared/trainee/traineeTexts";
import { useRouteTrainee } from "@/shared/trainee/useRouteTrainee";
import RestrictionsHistory from "./components/RestrictionsHistory";
import { TRAINEE_RESTRICTIONS_TEXTS } from "./traineeRestrictionsTexts";

/** היסטוריית "הגבלה/היתר לחניך" של חניך אחד, וטופס ההגבלה במסך מלא מעליה (ספק 03) */
export default function TraineeRestrictionsScreen() {
  useScrollToTopOnOpen();

  return (
    <AppPage>
      <TraineeRestrictionsContent />
    </AppPage>
  );
}

function TraineeRestrictionsContent() {
  const { traineeId, trainee } = useRouteTrainee();
  const permission = usePermissionCheck(PERMISSION_IDS.traineeRestriction);

  const header = <PageHeader title={TRAINEE_RESTRICTIONS_TEXTS.title} />;
  // במצבים שאין בהם רשימה מוצגת רק הכותרת, באותו מקום כמו כשיש רשימה
  const pinnedHeaderOnly = <PinnedPageTop>{header}</PinnedPageTop>;

  if (traineeId === null || trainee.status === "empty") {
    return (
      <>
        {pinnedHeaderOnly}
        <ScreenStateMessage message={TRAINEE_TEXTS.notFound} />
      </>
    );
  }

  if (permission.status === "loading") {
    return (
      <>
        {pinnedHeaderOnly}
        <HistorySkeleton loadingLabel={TRAINEE_RESTRICTIONS_TEXTS.states.loading} />
      </>
    );
  }

  if (permission.status !== "granted") {
    return (
      <>
        {pinnedHeaderOnly}
        <PermissionBlockedMessage permission={permission} />
      </>
    );
  }

  return <RestrictionsHistory traineeId={traineeId} header={header} />;
}
