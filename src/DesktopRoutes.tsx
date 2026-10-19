import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import DesktopTraineesListScreen from "./features/trainees-list/desktop/DesktopTraineesListScreen";
import { FALLBACK_ROUTE_PATTERN, ROUTE_PATTERNS } from "./routes";

/**
 * המסכים של פריסת הדסקטופ. בדסקטופ אין עמודים פנימיים: מסכי החניך יוצגו במגירה מעל הרשימה (שלב 2),
 * והמצב שלה בזכרון בלבד. לכן כל נתיב אחר - למשל אחרי מעבר מפריסת המובייל - חוזר לרשימה
 */
export default function DesktopRoutes() {
  return (
    <Routes>
      <Route path={ROUTE_PATTERNS.root} element={<DesktopTraineesListScreen />} />
      <Route path={FALLBACK_ROUTE_PATTERN} element={<RedirectToTraineesList />} />
    </Routes>
  );
}

// פרמטרי הכתובת (למשל תרחישי המוק) נשמרים, כמו בכניסה ישירה לנתיב פנימי
function RedirectToTraineesList() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: ROUTE_PATTERNS.root, search }} replace />;
}
