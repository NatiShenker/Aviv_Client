import { Navigate, Route, Routes } from "react-router-dom";
import { IpsThemeProvider, IpsToastProvider } from "ui-library";
import ControlsCatalog from "./catalog/ControlsCatalog";
import { ROUTES } from "./routes";

export default function App() {
  return (
    <IpsThemeProvider>
      <IpsToastProvider>
        <Routes>
          <Route path={ROUTES.catalog} element={<ControlsCatalog />} />
          {/* עד שיהיה מסך אמיתי, דף הבית מפנה לקטלוג */}
          <Route path={ROUTES.root} element={<Navigate to={ROUTES.catalog} replace />} />
        </Routes>
      </IpsToastProvider>
    </IpsThemeProvider>
  );
}
