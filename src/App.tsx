import { useEffect } from "react";
import { IpsThemeProvider, IpsToastProvider, TOAST_TYPES, useToast } from "ui-library";
import DesktopRoutes from "./DesktopRoutes";
import { INSTITUTES_TEXTS } from "./features/institutes/institutesTexts";
import AppErrorBoundary from "./infrastructure/errors/AppErrorBoundary";
import MobileRoutes from "./MobileRoutes";
import { InstitutesProvider, useInstitutes } from "./store/institutesContext";
import { PlatformProvider, usePlatform } from "./store/platformContext";

export default function App() {
  return (
    <IpsThemeProvider>
      <PlatformProvider>
        <IpsToastProvider>
          <AppErrorBoundary>
            <InstitutesProvider>
              <PermissionsFailureWarning />
              <LayoutRoutes />
            </InstitutesProvider>
          </AppErrorBoundary>
        </IpsToastProvider>
      </PlatformProvider>
    </IpsThemeProvider>
  );
}

/**
 * המקום היחיד שבוחר בין הפריסות. הפנימייה, הבחירה וההרשאות נשמרות במעבר ביניהן,
 * ורשימת החניכים שומרת בזכרון את החיפוש, הסינון והמיון
 */
function LayoutRoutes() {
  const { layout } = usePlatform();
  return layout === "desktop" ? <DesktopRoutes /> : <MobileRoutes />;
}

/**
 * ההרשאות נטענות ברקע, ולכן כשל לא חוסם את המסך - רק מודיע למשתמש.
 * רכיב נפרד שלא מציג כלום, כדי שה-store יחזיק מצב בלבד ושרק הרכיב הזה יתרנדר כשההקשר משתנה
 */
function PermissionsFailureWarning() {
  const { permissions } = useInstitutes();
  const addToast = useToast();

  useEffect(() => {
    if (permissions.status === "error") {
      addToast(TOAST_TYPES.WARNING, INSTITUTES_TEXTS.permissionsLoadFailed);
    }
  }, [permissions.status, addToast]);

  return null;
}
