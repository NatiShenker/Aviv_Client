import { createQueryCache } from "@/infrastructure/api/queryCache";
import { serviceClient } from "@/infrastructure/api/serviceClient";
import type { LookupItem } from "@/schemas/common.schema";
import { SERVICE_ENDPOINTS } from "./serviceEndpoints";

// לרשימות הסיבות עדיין אין חוזה בסכמה: הפעולות והתשובה (מערך LookupItem, ספק 00 §6) זמניות (ראו pending-decisions)
type GetReasonsResponse = LookupItem<number>[];

/** רשימת סיבות לכל פעולה (ספק 00 §6) */
type ReasonListKey = "traineeRestriction" | "phoneException" | "voiceMessage";

// רשימות הסיבות קבועות, ולכן נשמרות עד רענון הדף
const reasonsCache = createQueryCache<ReasonListKey, LookupItem<number>[]>((listKey) => listKey);

async function getReasons(listKey: ReasonListKey, url: string): Promise<LookupItem<number>[]> {
  const reasons = await serviceClient.get<GetReasonsResponse>(url);
  reasonsCache.set(listKey, reasons);
  return reasons;
}

/** הסיבות של "הגבלה/היתר לחניך" */
export function getTraineeRestrictionReasons(): Promise<LookupItem<number>[]> {
  return getReasons("traineeRestriction", SERVICE_ENDPOINTS.lookups.getTraineeRestrictionReasons);
}

export function getCachedTraineeRestrictionReasons(): LookupItem<number>[] | null {
  return reasonsCache.get("traineeRestriction");
}

/** הסיבות של "הגבלה/היתר למספר" */
export function getPhoneExceptionReasons(): Promise<LookupItem<number>[]> {
  return getReasons("phoneException", SERVICE_ENDPOINTS.lookups.getPhoneExceptionReasons);
}

export function getCachedPhoneExceptionReasons(): LookupItem<number>[] | null {
  return reasonsCache.get("phoneException");
}

/** הסיבות של "הודעה קולית לנמען" */
export function getVoiceMessageReasons(): Promise<LookupItem<number>[]> {
  return getReasons("voiceMessage", SERVICE_ENDPOINTS.lookups.getVoiceMessageReasons);
}

export function getCachedVoiceMessageReasons(): LookupItem<number>[] | null {
  return reasonsCache.get("voiceMessage");
}
