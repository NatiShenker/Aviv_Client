import { useEffect, type ReactNode } from "react";
import { IpsThemeProvider, IpsToastProvider, TOAST_TYPES, useToast } from "ui-library";
import { APP_TEXTS } from "./appTexts";
import DesktopRoutes from "./DesktopRoutes";
import { INSTITUTES_TEXTS } from "./features/institutes/institutesTexts";
import AppErrorBoundary from "./infrastructure/errors/AppErrorBoundary";
import MobileRoutes from "./MobileRoutes";
import { STICKY_ACTION_BAR_HEIGHT_PX } from "./shells/mobile/screenSpacing";
import { InstitutesProvider, useInstitutes } from "./store/institutesContext";
import { PlatformProvider, usePlatform } from "./store/platformContext";

export default function App() {
  return (
    <IpsThemeProvider>
      <PlatformProvider>
        <LayoutToastProvider>
          <AppErrorBoundary>
            <InstitutesProvider>
              <PermissionsFailureWarning />
              <LayoutRoutes />
            </InstitutesProvider>
          </AppErrorBoundary>
        </LayoutToastProvider>
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

// ההודעות למטה, ליד המקום שבו המשתמש לחץ (כמו snackbar). במובייל - מעל פס הפעולה שבתחתית המסך,
// ולא עליו (למשל "הוספת הגבלה" מיד אחרי שמירה); בדסקטופ - בצד שמאל, ליד מגירת החניך שבה שומרים
// (הוחלט 2026-10-21), במרחק ברירת המחדל של הספרייה
const TOAST_GAP_ABOVE_ACTION_BAR_PX = 8;
const TOAST_PLACEMENT_BY_LAYOUT = {
  mobile: { position: "bottom-right", bottomOffset: STICKY_ACTION_BAR_HEIGHT_PX + TOAST_GAP_ABOVE_ACTION_BAR_PX },
  desktop: { position: "bottom-left", bottomOffset: undefined },
} as const;

function LayoutToastProvider({ children }: { children: ReactNode }) {
  const { layout } = usePlatform();
  const { position, bottomOffset } = TOAST_PLACEMENT_BY_LAYOUT[layout];
  return (
    <IpsToastProvider
      position={position}
      bottomOffset={bottomOffset}
      closeButtonLabel={APP_TEXTS.toastCloseButton}
    >
      {children}
    </IpsToastProvider>
  );
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
