import { matchPath } from "react-router-dom";
import { ROUTE_PATTERNS } from "@/routes";

/*
 * הכתובת של אביב משורשרת לכתובת המארח:
 *   דומיין המארח (עם קידומת הסביבה) + הניתוב של המארח + הניתוב של אביב.
 * הבסיס של אביב הוא כל מה שבנתיב לפני הניתוב שלה. הוא נגזר בזמן הריצה, ולכן מתאים לכל מארח ולכל סביבה.
 */

const PATH_SEPARATOR = "/";
const ROOT_PATH = "/";

// הנתיבים הפנימיים של אביב (כל מה שאינו מסך הפתיחה)
const INNER_ROUTE_PATTERNS = Object.values(ROUTE_PATTERNS).filter((pattern) => pattern !== ROUTE_PATTERNS.root);

// דף הבדיקה של הפקדים נפתח רק מכתובת ישירה, ולכן הוא היחיד שנשאר בכניסה ישירה
const DIRECT_ENTRY_ALLOWED_PATTERNS = [ROUTE_PATTERNS.catalog];

interface AppLocation {
  /** הקידומת של המארח, למשל "/host/aviv". "/" כשאביב בשורש */
  basePath: string;
  /** הניתוב של אביב בתוך הכתובת, למשל "/child/5" */
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

/**
 * נקרא פעם אחת בעליית האפליקציה, לפני הראוטר. מחזיר את הבסיס של הראוטר (basename).
 * כניסה ישירה (קישור או רענון) לכתובת פנימית מתחילה ממסך הפתיחה: הכתובת מוחלפת בבסיס,
 * בלי רשומה נוספת בהיסטוריה. פרמטרי הכתובת (למשל תרחישי המוק) נשמרים.
 */
export function prepareAppEntry(): string {
  const { basePath, avivPath } = splitAppLocation(window.location.pathname);
  const isEntryAllowed =
    avivPath === ROOT_PATH || DIRECT_ENTRY_ALLOWED_PATTERNS.some((pattern) => matchPath(pattern, avivPath) !== null);

  if (!isEntryAllowed) {
    window.history.replaceState(null, "", `${basePath}${window.location.search}${window.location.hash}`);
  }
  return basePath;
}
