/** תבניות הנתיבים, להגדרת ה-Route ולזיהוי הנתיב הנוכחי */
export const ROUTE_PATTERNS = {
  root: "/",
  /** מסך הפעולות של חניך (ספק 02) */
  traineeActions: "/trainee/:traineeId",
  /** היסטוריית ההגבלות (ספק 03). כולל את נתיבי הטופס, שנפתח כמגירה מעל ההיסטוריה */
  traineeRestrictions: "/trainee/:traineeId/trainee-restriction/*",
  newTraineeRestriction: "/trainee/:traineeId/trainee-restriction/new",
  editTraineeRestriction: "/trainee/:traineeId/trainee-restriction/:recordId/edit",
  /** היסטוריית ההגבלות וההיתרים למספר (ספק 04). כולל את נתיבי הטופס, שנפתח כמגירה מעל ההיסטוריה */
  numberRestrictions: "/trainee/:traineeId/number-restriction/*",
  newNumberRecord: "/trainee/:traineeId/number-restriction/new",
  /** recordKey = סוג הרשומה ומזהה, למשל "permit-12" (להגבלות ולהיתרים יש רצפי מזהים נפרדים) */
  editNumberRecord: "/trainee/:traineeId/number-restriction/:recordKey/edit",
  /** היסטוריית ההודעות לנמען (ספק 05). כולל את נתיבי הטופס, שנפתח כמגירה מעל ההיסטוריה */
  voiceMessages: "/trainee/:traineeId/voice-message/*",
  newVoiceMessage: "/trainee/:traineeId/voice-message/new",
  editVoiceMessage: "/trainee/:traineeId/voice-message/:recordId/edit",
} as const;

/** פרמטרי הנתיבים, כפי שהם מופיעים בתבניות */
export interface TraineeRouteParams {
  traineeId: string;
  recordId: string;
  recordKey: string;
}

/** בכתובת יצירה: הרשומה שהסתיימה שהטופס החדש מתחיל ממנה, למשל ‎/trainee-restriction/new?basedOn=12 */
export const BASED_ON_QUERY_PARAM = "basedOn";

/** כתובת היצירה, ואם יש - הרשומה שהיא מבוססת עליה */
function withBasedOn(createPath: string, basedOnRef?: number | string): string {
  if (basedOnRef === undefined) return createPath;
  return `${createPath}?${new URLSearchParams({ [BASED_ON_QUERY_PARAM]: String(basedOnRef) })}`;
}

/** בניית כתובות לניווט */
export const ROUTES = {
  traineeActions: (traineeId: number) => `/trainee/${traineeId}`,
  traineeRestrictions: (traineeId: number) => `/trainee/${traineeId}/trainee-restriction`,
  newTraineeRestriction: (traineeId: number, basedOnRecordId?: number) =>
    withBasedOn(`/trainee/${traineeId}/trainee-restriction/new`, basedOnRecordId),
  editTraineeRestriction: (traineeId: number, recordId: number) => `/trainee/${traineeId}/trainee-restriction/${recordId}/edit`,
  numberRestrictions: (traineeId: number) => `/trainee/${traineeId}/number-restriction`,
  newNumberRecord: (traineeId: number, basedOnRecordKey?: string) =>
    withBasedOn(`/trainee/${traineeId}/number-restriction/new`, basedOnRecordKey),
  editNumberRecord: (traineeId: number, recordKey: string) => `/trainee/${traineeId}/number-restriction/${recordKey}/edit`,
  voiceMessages: (traineeId: number) => `/trainee/${traineeId}/voice-message`,
  newVoiceMessage: (traineeId: number, basedOnRecordId?: number) =>
    withBasedOn(`/trainee/${traineeId}/voice-message/new`, basedOnRecordId),
  editVoiceMessage: (traineeId: number, recordId: number) => `/trainee/${traineeId}/voice-message/${recordId}/edit`,
} as const;

const NUMERIC_ID_PATTERN = /^\d+$/;

/** מזהה מספרי מפרמטר בנתיב, או null כשהפרמטר חסר או לא מספר */
export function parseRouteId(param: string | undefined): number | null {
  if (!param || !NUMERIC_ID_PATTERN.test(param)) {
    return null;
  }
  return Number(param);
}
