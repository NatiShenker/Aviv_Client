import { IpsThemeProvider, IpsToastProvider } from "ui-library";
import DesktopRoutes from "./DesktopRoutes";
import { InstitutesProvider } from "./features/institutes/InstitutesProvider";
import AppErrorBoundary from "./infrastructure/errors/AppErrorBoundary";
import MobileRoutes from "./MobileRoutes";
import { PlatformProvider, usePlatform } from "./shared/platform/PlatformProvider";

export default function App() {
  return (
    <IpsThemeProvider>
      <PlatformProvider>
        <IpsToastProvider>
          <AppErrorBoundary>
            <InstitutesProvider>
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
