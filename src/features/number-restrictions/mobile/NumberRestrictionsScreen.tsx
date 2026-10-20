import { PERMISSION_IDS } from "@/features/institutes/permissions";
import RecordHistoryPage from "@/features/records/mobile/RecordHistoryPage";
import { NUMBER_RESTRICTIONS_TEXTS } from "../numberRestrictionsTexts";
import NumberRestrictionsHistory from "./NumberRestrictionsHistory";

/** היסטוריית "הגבלה/היתר למספר" של חניך אחד, וטופס ההגבלה / ההיתר במסך מלא מעליה (ספק 04) */
export default function NumberRestrictionsScreen() {
  return (
    <RecordHistoryPage
      title={NUMBER_RESTRICTIONS_TEXTS.title}
      permissionId={PERMISSION_IDS.numberRestriction}
      loadingLabel={NUMBER_RESTRICTIONS_TEXTS.states.loading}
      renderHistory={({ traineeId }, header) => <NumberRestrictionsHistory traineeId={traineeId} header={header} />}
    />
  );
}
