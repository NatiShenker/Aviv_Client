import { DECODE_TABLES } from "@/config/decodeTables";
import { SERVICE_ENDPOINTS } from "@/config/serviceEndpoints";
import { createQueryCache } from "@/infrastructure/queryCache";
import { serviceClient } from "@/infrastructure/serviceClient";
import {
  PHONE_EXCEPTION_REASONS_MOCK_DATA,
  TRAINEE_RESTRICTION_REASONS_MOCK_DATA,
  VOICE_MESSAGE_REASONS_MOCK_DATA,
} from "@/mock-server/data/reasonsMockData";
import type { LookupItem } from "@/types/common.schema";
import type { DecodeTableDto, GetDecodeRequest, GetDecodeResponse } from "@/types/lookups.schema";

/** רשימת סיבות לכל פעולה (ספק 00 §6) */
export type ReasonListKey = "traineeRestriction" | "phoneException" | "voiceMessage";

// מספר טבלת הקוד של כל רשימה (KC-1)
const REASON_CODE_TABLES: Record<ReasonListKey, number> = {
  traineeRestriction: DECODE_TABLES.traineeRestrictionReasons,
  phoneException: DECODE_TABLES.phoneExceptionReasons,
  voiceMessage: DECODE_TABLES.voiceMessageReasons,
};

/*
 * הנחיית המשתמש (K-6): כל עוד ה-DBA לא מילא את AVIV_DECODE, השרת מחזיר רשימה ריקה והטפסים ממשיכים עם רשימות ה-mock.
 * הנפילה כאן, בשכבת השירות, ולא בקומפוננטות. להסרה כשהטבלה תמולא (pending-decisions)
 */
const REASONS_FALLBACK: Record<ReasonListKey, LookupItem<number>[]> = {
  traineeRestriction: TRAINEE_RESTRICTION_REASONS_MOCK_DATA,
  phoneException: PHONE_EXCEPTION_REASONS_MOCK_DATA,
  voiceMessage: VOICE_MESSAGE_REASONS_MOCK_DATA,
};

const REASON_LIST_KEYS = Object.keys(REASON_CODE_TABLES) as ReasonListKey[];

// רשימות הסיבות קבועות, ולכן נשמרות עד רענון הדף
const reasonsCache = createQueryCache<ReasonListKey, LookupItem<number>[]>((listKey) => listKey);

/**
 * רשימת הסיבות של פעולה. שלוש הרשימות נטענות בקריאה אחת (Lookups/GetDecode, K-3) ונשמרות יחד,
 * כדי שכל טופס ייפתח עם הרשימה שלו מוכנה (נטענות מראש אחרי רשימת החניכים, prefetchReasons).
 */
export async function getReasons(listKey: ReasonListKey): Promise<LookupItem<number>[]> {
  const request: GetDecodeRequest = { codeTableList: REASON_LIST_KEYS.map((key) => REASON_CODE_TABLES[key]) };
  const tables = await serviceClient.post<GetDecodeResponse>(SERVICE_ENDPOINTS.lookups.getDecode, request);

  for (const key of REASON_LIST_KEYS) {
    reasonsCache.set(key, reasonsOfList(tables, key));
  }
  return reasonsCache.get(listKey) ?? REASONS_FALLBACK[listKey];
}

/** הפריטים של טבלת הקוד של הרשימה; טבלה ריקה → רשימת ה-mock של אותה רשימה (K-6) */
function reasonsOfList(tables: DecodeTableDto[], listKey: ReasonListKey): LookupItem<number>[] {
  const table = tables.find((candidate) => candidate.codeTable === REASON_CODE_TABLES[listKey]);
  const items = table?.items ?? [];
  return items.length > 0 ? items : REASONS_FALLBACK[listKey];
}

export function getCachedReasons(listKey: ReasonListKey): LookupItem<number>[] | null {
  return reasonsCache.get(listKey);
}

/**
 * טעינה מראש של שלוש הרשימות ברקע, יחד עם המכשירים, אחרי שרשימת החניכים נטענה (שדה הסיבה הוא חובה, והשמירה
 * מחכה לרשימה). כשל כאן לא מוצג - הטופס יטען שוב ויציג את המצב במקום שבו הוא משנה
 */
export function prefetchReasons(): void {
  if (REASON_LIST_KEYS.every((key) => getCachedReasons(key))) return;
  getReasons(REASON_LIST_KEYS[0]).catch(() => undefined);
}
