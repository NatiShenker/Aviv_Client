import { Route, Routes } from "react-router-dom";
import { IpsThemeProvider, IpsToastProvider } from "ui-library";
import ControlsCatalog from "./catalog/ControlsCatalog";
import { InstitutesProvider } from "./context/institutes/InstitutesProvider";
import TraineeActionsScreen from "./screens/trainee-actions/TraineeActionsScreen";
import TraineeRestrictionsScreen from "./screens/trainee-restrictions/TraineeRestrictionsScreen";
import TraineesListScreen from "./screens/trainees-list/TraineesListScreen";
import AppErrorBoundary from "./infrastructure/errors/AppErrorBoundary";
import { ROUTE_PATTERNS } from "./routes";

export default function App() {
  return (
    <IpsThemeProvider>
      <IpsToastProvider>
        <AppErrorBoundary>
          <InstitutesProvider>
            <Routes>
              <Route path={ROUTE_PATTERNS.root} element={<TraineesListScreen />} />
              <Route path={ROUTE_PATTERNS.catalog} element={<ControlsCatalog />} />
              <Route path={ROUTE_PATTERNS.traineeActions} element={<TraineeActionsScreen />} />
              <Route path={ROUTE_PATTERNS.traineeRestrictions} element={<TraineeRestrictionsScreen />} />
            </Routes>
          </InstitutesProvider>
        </AppErrorBoundary>
      </IpsToastProvider>
    </IpsThemeProvider>
  );
}
