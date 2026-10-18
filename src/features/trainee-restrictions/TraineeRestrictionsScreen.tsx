import PermissionBlockedMessage from "@/features/institutes/PermissionBlockedMessage";
import { PERMISSION_IDS } from "@/features/institutes/permissionIds";
import { usePermissionCheck } from "@/features/institutes/usePermissionCheck";
import HistorySkeleton from "@/features/records/history/HistorySkeleton";
import { TRAINEE_TEXTS } from "@/features/trainee/traineeTexts";
import { useRouteTrainee } from "@/features/trainee/useRouteTrainee";
import ScreenStateMessage from "@/shared/components/ScreenStateMessage";
import AppPage from "@/shells/mobile/AppPage";
import { useScrollToTopOnOpen } from "@/shells/mobile/hooks/useScrollToTopOnOpen";
import PageHeader from "@/shells/mobile/PageHeader";
import PinnedPageTop from "@/shells/mobile/PinnedPageTop";
import RestrictionsHistory from "./history/RestrictionsHistory";
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
