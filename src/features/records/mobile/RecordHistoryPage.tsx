import type { ReactNode } from "react";
import PermissionBlockedMessage from "@/features/institutes/PermissionBlockedMessage";
import type { PermissionId } from "@/features/institutes/permissions";
import { useRouteTraineeDisplayName } from "@/features/trainee/mobile/useRouteTraineeDisplayName";
import { useTraineeActionAccess, type TraineeActionAccess } from "@/features/trainee/mobile/useTraineeActionAccess";
import { TRAINEE_TEXTS } from "@/features/trainee/traineeTexts";
import ScreenStateMessage from "@/shared/components/ScreenStateMessage";
import AppPage from "@/shells/mobile/AppPage";
import { useScrollToTopOnOpen } from "@/shells/mobile/navigation/useScrollToTopOnOpen";
import PageHeader from "@/shells/mobile/PageHeader";
import PinnedPageTop from "@/shells/mobile/PinnedPageTop";
import { SCREEN_SIDE_GUTTER_CLASS } from "@/shells/mobile/screenSpacing";
import HistorySkeleton from "../history/HistorySkeleton";

type ReadyAccess = Extract<TraineeActionAccess, { status: "ready" }>;

interface RecordHistoryPageProps {
  title: string;
  permissionId: PermissionId;
  /** טקסט השלד בזמן שההרשאות נטענות */
  loadingLabel: string;
  /** ההיסטוריה עצמה. header – כותרת המסך, שננעצת יחד עם כלי הרשימה */
  renderHistory: (access: ReadyAccess, header: ReactNode) => ReactNode;
}

/**
 * מסך היסטוריה של פעולה על חניך במובייל (ספק 00 §4.1): הכותרת עם החניך מתחתיה, ובמקום הרשימה – חניך שלא נמצא,
 * טעינת ההרשאות או חסימה (ספק 02 §7)
 */
export default function RecordHistoryPage(props: RecordHistoryPageProps) {
  useScrollToTopOnOpen();

  return (
    <AppPage>
      <RecordHistoryPageContent {...props} />
    </AppPage>
  );
}

function RecordHistoryPageContent({ title, permissionId, loadingLabel, renderHistory }: RecordHistoryPageProps) {
  const access = useTraineeActionAccess(permissionId);
  const traineeDisplayName = useRouteTraineeDisplayName();
  const header = <PageHeader title={title} subtitle={traineeDisplayName} />;

  if (access.status === "ready") {
    return <>{renderHistory(access, header)}</>;
  }

  // במצבים שאין בהם רשימה מוצגת רק הכותרת, באותו מקום כמו כשיש רשימה
  return (
    <>
      <PinnedPageTop>{header}</PinnedPageTop>
      <div className={SCREEN_SIDE_GUTTER_CLASS}>
        {access.status === "notFound" && <ScreenStateMessage message={TRAINEE_TEXTS.notFound} />}
        {access.status === "loading" && <HistorySkeleton loadingLabel={loadingLabel} />}
        {access.status === "blocked" && <PermissionBlockedMessage permission={access.permission} />}
      </div>
    </>
  );
}
