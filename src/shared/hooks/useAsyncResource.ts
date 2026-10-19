import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toAppError, type AppError } from "@/infrastructure/errors/appError";
import { reportError } from "@/infrastructure/errors/errorReporting";

/** idle = אין עדיין מה לטעון (המפתח null) */
export type AsyncStatus = "idle" | "loading" | "success" | "empty" | "error";

export interface AsyncResource<TData> {
  status: AsyncStatus;
  data: TData | null;
  error: AppError | null;
  /** טעינה מהשרת עם מצב טעינה (למשל "נסה שוב") */
  reload: () => void;
  /**
   * טעינה מהשרת בשקט: הנתונים הנוכחיים נשארים מוצגים עד שהחדשים מגיעים, בלי מצב טעינה.
   * כישלון משאיר את הנתונים הקיימים ומדווח בלבד
   */
  refreshInBackground: () => void;
}

const BACKGROUND_REFRESH_ERROR_CONTEXT = "background refresh";

/** בדיקת "ריק" לתשובה שהיא רשימה (לאפשרות isEmpty) */
export function isEmptyList(list: unknown[]): boolean {
  return list.length === 0;
}

type RequestKey = string | number;

interface UseAsyncResourceOptions<TKey extends RequestKey, TData> {
  /** מזהה הבקשה. שינוי שלו מפעיל טעינה חדשה; null = לא לטעון */
  requestKey: TKey | null;
  /** מקבל את המפתח (תמיד לא null) ומחזיר את הנתונים */
  load: (requestKey: TKey) => Promise<TData>;
  /** קובע אם תשובה תקינה נחשבת ריקה (למשל רשימה בלי פריטים) */
  isEmpty?: (data: TData) => boolean;
  /**
   * נתונים שכבר נטענו למפתח הזה (למשל בחזרה למסך ממסך אחר): מוצגים מיד, בלי טעינה.
   * reload ("נסה שוב") טוען תמיד מהשרת.
   */
  readCache?: (requestKey: TKey) => TData | null;
}

interface ResourceState<TData> {
  status: AsyncStatus;
  data: TData | null;
  error: AppError | null;
}

const IDLE_STATE: ResourceState<never> = { status: "idle", data: null, error: null };
const LOADING_STATE: ResourceState<never> = { status: "loading", data: null, error: null };

function toLoadedState<TData>(data: TData, isEmpty?: (data: TData) => boolean): ResourceState<TData> {
  const isEmptyResult = isEmpty?.(data) ?? false;
  return { status: isEmptyResult ? "empty" : "success", data, error: null };
}

/** טעינה אסינכרונית עם מצבי טעינה, ריק ושגיאה, טעינה חוזרת ושימוש בנתונים שכבר נטענו */
export function useAsyncResource<TKey extends RequestKey, TData>({
  requestKey,
  load,
  isEmpty,
  readCache,
}: UseAsyncResourceOptions<TKey, TData>): AsyncResource<TData> {
  // נתונים שמורים מוצגים כבר ברינדור הראשון, כדי שבחזרה למסך לא יהבהב מצב טעינה
  const [state, setState] = useState<ResourceState<TData>>(() => {
    const cachedData = requestKey !== null ? readCache?.(requestKey) ?? null : null;
    return cachedData !== null ? toLoadedState(cachedData, isEmpty) : IDLE_STATE;
  });
  const [reloadCount, setReloadCount] = useState(0);
  const shouldBypassCacheRef = useRef(false);

  // הפונקציות נשמרות ב-ref כדי שרק שינוי המפתח (או reload) יפעיל טעינה, ולא כל רינדור
  const loadRef = useRef(load);
  const isEmptyRef = useRef(isEmpty);
  const readCacheRef = useRef(readCache);
  const requestKeyRef = useRef(requestKey);
  loadRef.current = load;
  isEmptyRef.current = isEmpty;
  readCacheRef.current = readCache;
  requestKeyRef.current = requestKey;

  useEffect(() => {
    if (requestKey === null) {
      setState(IDLE_STATE);
      return;
    }

    const shouldBypassCache = shouldBypassCacheRef.current;
    shouldBypassCacheRef.current = false;
    const cachedData = shouldBypassCache ? null : readCacheRef.current?.(requestKey) ?? null;
    if (cachedData !== null) {
      setState((current) => (current.data === cachedData ? current : toLoadedState(cachedData, isEmptyRef.current)));
      return;
    }

    let isLatestRequest = true;
    setState(LOADING_STATE);

    loadRef
      .current(requestKey)
      .then((data) => {
        if (!isLatestRequest) return;
        setState(toLoadedState(data, isEmptyRef.current));
      })
      .catch((error: unknown) => {
        if (!isLatestRequest) return;
        setState({ status: "error", data: null, error: toAppError(error) });
      });

    // תשובה שמגיעה אחרי שהמפתח השתנה שייכת לבקשה ישנה, ולכן מתעלמים ממנה
    return () => {
      isLatestRequest = false;
    };
  }, [requestKey, reloadCount]);

  const reload = useCallback(() => {
    shouldBypassCacheRef.current = true;
    setReloadCount((count) => count + 1);
  }, []);

  const refreshInBackground = useCallback(() => {
    const refreshedKey = requestKeyRef.current;
    if (refreshedKey === null) return;

    loadRef
      .current(refreshedKey)
      .then((data) => {
        // תשובה ששייכת למפתח קודם (למשל הפנימייה התחלפה בינתיים) לא מחליפה את הנתונים
        if (requestKeyRef.current !== refreshedKey) return;
        setState(toLoadedState(data, isEmptyRef.current));
      })
      .catch((error: unknown) => {
        reportError(toAppError(error), BACKGROUND_REFRESH_ERROR_CONTEXT);
      });
  }, []);

  return useMemo(() => ({ ...state, reload, refreshInBackground }), [state, reload, refreshInBackground]);
}
