import { Route, Routes } from "react-router-dom";
import NumberRestrictionsScreen from "./features/number-restrictions/NumberRestrictionsScreen";
import TraineeActionsScreen from "./features/trainee-actions/TraineeActionsScreen";
import TraineeRestrictionsScreen from "./features/trainee-restrictions/TraineeRestrictionsScreen";
import TraineesListScreen from "./features/trainees-list/TraineesListScreen";
import VoiceMessagesScreen from "./features/voice-messages/VoiceMessagesScreen";
import { ROUTE_PATTERNS } from "./routes";
import { FormControlsProvider } from "./shared/form-controls/FormControlsProvider";
import { MOBILE_FORM_CONTROLS } from "./shells/mobile/mobileFormControls";

/** המסכים של פריסת המובייל: כל מסך הוא עמוד, והטפסים בהם עם הפקדים הנייטיביים */
export default function MobileRoutes() {
  return (
    <FormControlsProvider controls={MOBILE_FORM_CONTROLS}>
      <Routes>
        <Route path={ROUTE_PATTERNS.root} element={<TraineesListScreen />} />
        <Route path={ROUTE_PATTERNS.traineeActions} element={<TraineeActionsScreen />} />
        <Route path={ROUTE_PATTERNS.traineeRestrictions} element={<TraineeRestrictionsScreen />} />
        <Route path={ROUTE_PATTERNS.numberRestrictions} element={<NumberRestrictionsScreen />} />
        <Route path={ROUTE_PATTERNS.voiceMessages} element={<VoiceMessagesScreen />} />
      </Routes>
    </FormControlsProvider>
  );
}
