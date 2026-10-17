import { Route, Routes } from "react-router-dom";
import { IpsThemeProvider, IpsToastProvider } from "ui-library";
import ControlsCatalog from "./catalog/ControlsCatalog";
import { InstitutesProvider } from "./context/institutes/InstitutesProvider";
import TraineesListScreen from "./screens/trainees-list/TraineesListScreen";
import AppErrorBoundary from "./infrastructure/errors/AppErrorBoundary";
import { ROUTES } from "./routes";

export default function App() {
  return (
    <IpsThemeProvider>
      <IpsToastProvider>
        <AppErrorBoundary>
          <InstitutesProvider>
            <Routes>
              <Route path={ROUTES.root} element={<TraineesListScreen />} />
              <Route path={ROUTES.catalog} element={<ControlsCatalog />} />
            </Routes>
          </InstitutesProvider>
        </AppErrorBoundary>
      </IpsToastProvider>
    </IpsThemeProvider>
  );
}
