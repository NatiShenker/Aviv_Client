/** תבניות הנתיבים, להגדרת ה-Route ולזיהוי הנתיב הנוכחי */
export const ROUTE_PATTERNS = {
  root: "/",
  catalog: "/catalog",
  /** מסך הפעולות של חניך (ספק 02) */
  traineeActions: "/child/:traineeId",
  /** היסטוריית ההגבלות (ספק 03). כולל את נתיבי הטופס, שנפתח כמגירה מעל ההיסטוריה */
  traineeRestrictions: "/child/:traineeId/block/*",
  newTraineeRestriction: "/child/:traineeId/block/new",
  editTraineeRestriction: "/child/:traineeId/block/:recordId/edit",
  /** היסטוריית ההגבלות וההיתרים למספר (ספק 04). כולל את נתיבי הטופס, שנפתח כמגירה מעל ההיסטוריה */
  numberRestrictions: "/child/:traineeId/exception/*",
  newNumberRecord: "/child/:traineeId/exception/new",
  /** recordKey = סוג הרשומה ומזהה, למשל "permit-12" (להגבלות ולהיתרים יש רצפי מזהים נפרדים) */
  editNumberRecord: "/child/:traineeId/exception/:recordKey/edit",
  /** היסטוריית ההודעות לנמען (ספק 05). כולל את נתיבי הטופס, שנפתח כמגירה מעל ההיסטוריה */
  voiceMessages: "/child/:traineeId/voice-message/*",
  newVoiceMessage: "/child/:traineeId/voice-message/new",
  editVoiceMessage: "/child/:traineeId/voice-message/:recordId/edit",
} as const;

/** פרמטרי הנתיבים, כפי שהם מופיעים בתבניות */
export interface TraineeRouteParams {
  traineeId: string;
  recordId: string;
  recordKey: string;
}

/** בכתובת יצירה: הרשומה שהסתיימה שהטופס החדש מתחיל ממנה, למשל ‎/block/new?basedOn=12 */
export const BASED_ON_QUERY_PARAM = "basedOn";

/** כתובת היצירה, ואם יש - הרשומה שהיא מבוססת עליה */
function withBasedOn(createPath: string, basedOnRef?: number | string): string {
  if (basedOnRef === undefined) return createPath;
  return `${createPath}?${new URLSearchParams({ [BASED_ON_QUERY_PARAM]: String(basedOnRef) })}`;
}

/** בניית כתובות לניווט */
export const ROUTES = {
  root: ROUTE_PATTERNS.root,
  catalog: ROUTE_PATTERNS.catalog,
  traineeActions: (traineeId: number) => `/child/${traineeId}`,
  traineeRestrictions: (traineeId: number) => `/child/${traineeId}/block`,
  newTraineeRestriction: (traineeId: number, basedOnRecordId?: number) =>
    withBasedOn(`/child/${traineeId}/block/new`, basedOnRecordId),
  editTraineeRestriction: (traineeId: number, recordId: number) => `/child/${traineeId}/block/${recordId}/edit`,
  numberRestrictions: (traineeId: number) => `/child/${traineeId}/exception`,
  newNumberRecord: (traineeId: number, basedOnRecordKey?: string) =>
    withBasedOn(`/child/${traineeId}/exception/new`, basedOnRecordKey),
  editNumberRecord: (traineeId: number, recordKey: string) => `/child/${traineeId}/exception/${recordKey}/edit`,
  voiceMessages: (traineeId: number) => `/child/${traineeId}/voice-message`,
  newVoiceMessage: (traineeId: number, basedOnRecordId?: number) =>
    withBasedOn(`/child/${traineeId}/voice-message/new`, basedOnRecordId),
  editVoiceMessage: (traineeId: number, recordId: number) => `/child/${traineeId}/voice-message/${recordId}/edit`,
} as const;

const NUMERIC_ID_PATTERN = /^\d+$/;

/** מזהה מספרי מפרמטר בנתיב, או null כשהפרמטר חסר או לא מספר */
export function parseRouteId(param: string | undefined): number | null {
  if (!param || !NUMERIC_ID_PATTERN.test(param)) {
    return null;
  }
  return Number(param);
}
