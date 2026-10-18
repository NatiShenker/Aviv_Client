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
import VoiceMessagesHistory from "./components/VoiceMessagesHistory";
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
