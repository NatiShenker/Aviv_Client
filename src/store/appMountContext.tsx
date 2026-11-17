import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";

/*
 * ההרכבה של אביב בכתובת. אביב מרונדרת כאלמנט של מסלול "/*": במארח - המסלול שהמארח מגדיר לה
 * (למשל "service/:id/*"), ובמצב העצמאי - הראוטר של bootstrap. הספק מרנדר מסלול "/*" משלו תחת שניהם,
 * ולכן הבסיס שלה - הנתיב הנוכחי בלי שארית ה-splat - נגזר באותו אופן בשני המצבים.
 * הראוטר פותר כתובת מוחלטת מול ה-basename שלו (במארח - של המארח), ולא מול המסלול של אביב,
 * ולכן כל כתובת של אביב מקבלת את הבסיס כקידומת דרך useAppPath
 */

const APP_MOUNT_ROUTE_PATTERN = "/*";
const PATH_SEPARATOR = "/";
const ROOT_PATH = "/";
const SPLAT_PARAM = "*";

/** ממיר כתובת של אביב (ROUTES, למשל "/trainee/5") לכתובת בראוטר, עם הבסיס שאביב מורכבת בו */
type ToAppPath = (avivPath: string) => string;

const AppBasePathContext = createContext<string | null>(null);

function pathSegments(path: string): string[] {
  return path.split(PATH_SEPARATOR).filter(Boolean);
}

/** הנתיב הנוכחי בלי שארית ה-splat של המסלול שאביב מורכבת בו. "/" כשאביב בשורש */
function resolveBasePath(pathname: string, splatRemainder: string): string {
  const segments = pathSegments(pathname);
  const baseSegments = segments.slice(0, segments.length - pathSegments(splatRemainder).length);
  if (baseSegments.length === 0) return ROOT_PATH;
  return PATH_SEPARATOR + baseSegments.join(PATH_SEPARATOR);
}

interface AppMountProps {
  children: ReactNode;
}

/** יושב בשורש של אביב, מעל ה-Routes של הפריסות */
export function AppMountProvider({ children }: AppMountProps) {
  return (
    <Routes>
      <Route path={APP_MOUNT_ROUTE_PATTERN} element={<MountedApp>{children}</MountedApp>} />
    </Routes>
  );
}

/**
 * גוזר את הבסיס מהמסלול שמעליו. כניסה ישירה לנתיב פנימי (קישור או רענון) מתחילה ממסך הפתיחה:
 * הכתובת מוחלפת בבסיס (פרמטרי הכתובת נשמרים), בלי רשומה נוספת בהיסטוריה, ועד אז לא מוצג כלום.
 * במצב העצמאי זה לא מופעל, כי prepareAppEntry כבר החליף את הכתובת לפני שהראוטר עלה
 */
function MountedApp({ children }: AppMountProps) {
  const { pathname, search, hash } = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const splatRemainder = params[SPLAT_PARAM] ?? "";
  const basePath = resolveBasePath(pathname, splatRemainder);
  const [isEntryRedirectPending, setIsEntryRedirectPending] = useState(() => splatRemainder !== "");

  useEffect(() => {
    if (!isEntryRedirectPending) return;
    navigate({ pathname: basePath, search, hash }, { replace: true });
    setIsEntryRedirectPending(false);
  }, [isEntryRedirectPending, navigate, basePath, search, hash]);

  if (isEntryRedirectPending) return null;

  return <AppBasePathContext.Provider value={basePath}>{children}</AppBasePathContext.Provider>;
}

export function useAppPath(): ToAppPath {
  const basePath = useContext(AppBasePathContext);
  const toAppPath = useCallback<ToAppPath>(
    (avivPath) => (basePath === ROOT_PATH ? avivPath : `${basePath}${avivPath}`),
    [basePath],
  );
  if (basePath === null) {
    throw new Error("useAppPath must be used inside AppMountProvider");
  }
  return toAppPath;
}
