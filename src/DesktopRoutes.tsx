import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import DesktopTraineesListScreen from "./features/trainees-list/desktop/DesktopTraineesListScreen";
import { FALLBACK_ROUTE_PATTERN, ROUTE_PATTERNS } from "./routes";
import { FormControlsProvider } from "./shared/form-controls/FormControlsProvider";
import { DESKTOP_FORM_CONTROLS } from "./shells/desktop/form-controls/desktopFormControls";

/**
 * המסכים של פריסת הדסקטופ. בדסקטופ אין עמודים פנימיים: מסכי החניך מוצגים במגירה מעל הרשימה,
 * והמצב שלה בזכרון בלבד. לכן כל נתיב אחר - למשל אחרי מעבר מפריסת המובייל - חוזר לרשימה.
 * הטפסים במגירה - עם פקדי הדסקטופ (MUI) של הספרייה
 */
export default function DesktopRoutes() {
  return (
    <FormControlsProvider controls={DESKTOP_FORM_CONTROLS}>
      <Routes>
        <Route path={ROUTE_PATTERNS.root} element={<DesktopTraineesListScreen />} />
        <Route path={FALLBACK_ROUTE_PATTERN} element={<RedirectToTraineesList />} />
      </Routes>
    </FormControlsProvider>
  );
}

// פרמטרי הכתובת (למשל תרחישי המוק) נשמרים, כמו בכניסה ישירה לנתיב פנימי
function RedirectToTraineesList() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: ROUTE_PATTERNS.root, search }} replace />;
}
