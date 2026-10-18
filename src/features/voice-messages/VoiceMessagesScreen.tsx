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
import VoiceMessagesHistory from "./history/VoiceMessagesHistory";
import { VOICE_MESSAGES_TEXTS } from "./voiceMessagesTexts";

/** היסטוריית "הודעה קולית לנמען" של חניך אחד, וטופס ההודעה במסך מלא מעליה (ספק 05) */
export default function VoiceMessagesScreen() {
  useScrollToTopOnOpen();

  return (
    <AppPage>
      <VoiceMessagesContent />
    </AppPage>
  );
}

function VoiceMessagesContent() {
  const { traineeId, trainee } = useRouteTrainee();
  const permission = usePermissionCheck(PERMISSION_IDS.voiceMessage);

  const header = <PageHeader title={VOICE_MESSAGES_TEXTS.title} />;
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
        <HistorySkeleton loadingLabel={VOICE_MESSAGES_TEXTS.states.loading} />
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

  return (
    <VoiceMessagesHistory
      traineeId={traineeId}
      traineeFullName={trainee.data?.fullName ?? ""}
      header={header}
    />
  );
}
