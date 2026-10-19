import type { ReactNode } from "react";
import PermissionBlockedMessage from "@/features/institutes/PermissionBlockedMessage";
import type { PermissionId } from "@/features/institutes/permissionIds";
import { TRAINEE_TEXTS } from "@/features/trainee/traineeTexts";
import { useTraineeActionAccess, type TraineeActionAccess } from "@/features/trainee/useTraineeActionAccess";
import ScreenStateMessage from "@/shared/components/ScreenStateMessage";
import AppPage from "@/shells/mobile/AppPage";
import { useScrollToTopOnOpen } from "@/shells/mobile/hooks/useScrollToTopOnOpen";
import PageHeader from "@/shells/mobile/PageHeader";
import PinnedPageTop from "@/shells/mobile/PinnedPageTop";
import HistorySkeleton from "./HistorySkeleton";

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
 * מסך היסטוריה של פעולה על חניך במובייל (ספק 00 §4.1): הכותרת, ובמקום הרשימה – חניך שלא נמצא,
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
  const header = <PageHeader title={title} />;

  if (access.status === "ready") {
    return <>{renderHistory(access, header)}</>;
  }

  // במצבים שאין בהם רשימה מוצגת רק הכותרת, באותו מקום כמו כשיש רשימה
  return (
    <>
      <PinnedPageTop>{header}</PinnedPageTop>
      {access.status === "notFound" && <ScreenStateMessage message={TRAINEE_TEXTS.notFound} />}
      {access.status === "loading" && <HistorySkeleton loadingLabel={loadingLabel} />}
      {access.status === "blocked" && <PermissionBlockedMessage permission={access.permission} />}
    </>
  );
}
