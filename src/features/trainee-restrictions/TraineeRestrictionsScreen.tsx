import { PERMISSION_IDS } from "@/features/institutes/permissionIds";
import RecordHistoryPage from "@/features/records/history/RecordHistoryPage";
import RestrictionsHistory from "./history/RestrictionsHistory";
import { TRAINEE_RESTRICTIONS_TEXTS } from "./traineeRestrictionsTexts";

/** היסטוריית "הגבלה/היתר לחניך" של חניך אחד, וטופס ההגבלה במסך מלא מעליה (ספק 03) */
export default function TraineeRestrictionsScreen() {
  return (
    <RecordHistoryPage
      title={TRAINEE_RESTRICTIONS_TEXTS.title}
      permissionId={PERMISSION_IDS.traineeRestriction}
      loadingLabel={TRAINEE_RESTRICTIONS_TEXTS.states.loading}
      renderHistory={({ traineeId }, header) => <RestrictionsHistory traineeId={traineeId} header={header} />}
    />
  );
}
