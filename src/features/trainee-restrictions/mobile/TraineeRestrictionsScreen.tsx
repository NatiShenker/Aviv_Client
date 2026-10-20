import { PERMISSION_IDS } from "@/features/institutes/permissions";
import RecordHistoryPage from "@/features/records/mobile/RecordHistoryPage";
import { TRAINEE_RESTRICTIONS_TEXTS } from "../traineeRestrictionsTexts";
import TraineeRestrictionsHistory from "./TraineeRestrictionsHistory";

/** היסטוריית "הגבלה/היתר לחניך" של חניך אחד, וטופס ההגבלה במסך מלא מעליה (ספק 03) */
export default function TraineeRestrictionsScreen() {
  return (
    <RecordHistoryPage
      title={TRAINEE_RESTRICTIONS_TEXTS.title}
      permissionId={PERMISSION_IDS.traineeRestriction}
      loadingLabel={TRAINEE_RESTRICTIONS_TEXTS.states.loading}
      renderHistory={({ traineeId }, header) => <TraineeRestrictionsHistory traineeId={traineeId} header={header} />}
    />
  );
}
