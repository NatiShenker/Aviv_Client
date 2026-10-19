import { PERMISSION_IDS } from "@/features/institutes/permissionIds";
import RecordHistoryPage from "@/features/records/history/RecordHistoryPage";
import VoiceMessagesHistory from "./history/VoiceMessagesHistory";
import { VOICE_MESSAGES_TEXTS } from "./voiceMessagesTexts";

/** היסטוריית "הודעה קולית לנמען" של חניך אחד, וטופס ההודעה במסך מלא מעליה (ספק 05) */
export default function VoiceMessagesScreen() {
  return (
    <RecordHistoryPage
      title={VOICE_MESSAGES_TEXTS.title}
      permissionId={PERMISSION_IDS.voiceMessage}
      loadingLabel={VOICE_MESSAGES_TEXTS.states.loading}
      renderHistory={({ traineeId, trainee }, header) => (
        <VoiceMessagesHistory traineeId={traineeId} traineeFullName={trainee?.fullName ?? ""} header={header} />
      )}
    />
  );
}
