import { matchPath } from "react-router-dom";
import { BASED_ON_QUERY_PARAM, ROUTE_PATTERNS } from "@/routes";

/*
 * הכתובת של אביב משורשרת לכתובת המארח:
 *   דומיין המארח (עם קידומת הסביבה) + הניתוב של המארח + הניתוב של אביב.
 * הבסיס של אביב הוא כל מה שבנתיב לפני הניתוב שלה. הוא נגזר בזמן הריצה, ולכן מתאים לכל מארח ולכל סביבה.
 */

const PATH_SEPARATOR = "/";
const ROOT_PATH = "/";

// הנתיבים הפנימיים של אביב (כל מה שאינו מסך הפתיחה)
const INNER_ROUTE_PATTERNS = Object.values(ROUTE_PATTERNS).filter((pattern) => pattern !== ROUTE_PATTERNS.root);

// פרמטרים שיש להם משמעות רק בנתיב פנימי, ולכן נמחקים יחד איתו בכניסה ישירה
const INNER_ROUTE_QUERY_PARAMS = [BASED_ON_QUERY_PARAM];

interface AppLocation {
  /** הקידומת של המארח, למשל "/host/aviv". "/" כשאביב בשורש */
  basePath: string;
  /** הניתוב של אביב בתוך הכתובת, למשל "/trainee/5" */
  avivPath: string;
}

function isInnerAvivPath(path: string): boolean {
  return INNER_ROUTE_PATTERNS.some((pattern) => matchPath(pattern, path) !== null);
}

function joinSegments(segments: string[]): string {
  return PATH_SEPARATOR + segments.join(PATH_SEPARATOR);
}

/** מפריד את הנתיב לקידומת של המארח ולניתוב של אביב: הסיומת הארוכה ביותר שהיא נתיב מוכר של אביב */
export function splitAppLocation(pathname: string): AppLocation {
  const segments = pathname.split(PATH_SEPARATOR).filter(Boolean);

  for (let avivStartIndex = 0; avivStartIndex < segments.length; avivStartIndex++) {
    const avivPath = joinSegments(segments.slice(avivStartIndex));
    if (isInnerAvivPath(avivPath)) {
      return { basePath: joinSegments(segments.slice(0, avivStartIndex)), avivPath };
    }
  }
  return { basePath: joinSegments(segments), avivPath: ROOT_PATH };
}

/** פרמטרי הכתובת בלי אלה של הנתיב הפנימי. כשאין כאלה, הטקסט נשאר בדיוק כפי שהיה */
function withoutInnerRouteParams(search: string): string {
  const params = new URLSearchParams(search);
  const innerParamsFound = INNER_ROUTE_QUERY_PARAMS.filter((param) => params.has(param));
  if (innerParamsFound.length === 0) return search;

  innerParamsFound.forEach((param) => params.delete(param));
  const remainingParams = params.toString();
  return remainingParams === "" ? "" : `?${remainingParams}`;
}

/**
 * נקרא פעם אחת בעליית האפליקציה, לפני הראוטר. מחזיר את הבסיס של הראוטר (basename).
 * כניסה ישירה (קישור או רענון) לכתובת פנימית מתחילה ממסך הפתיחה: הכתובת מוחלפת בבסיס,
 * בלי רשומה נוספת בהיסטוריה. פרמטרי הכתובת (למשל תרחישי המוק) נשמרים, חוץ מאלה של הנתיב הפנימי.
 */
export function prepareAppEntry(): string {
  const { basePath, avivPath } = splitAppLocation(window.location.pathname);

  if (avivPath !== ROOT_PATH) {
    const entrySearch = withoutInnerRouteParams(window.location.search);
    window.history.replaceState(null, "", `${basePath}${entrySearch}${window.location.hash}`);
  }
  return basePath;
}
