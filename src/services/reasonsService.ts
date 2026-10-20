import { SERVICE_ENDPOINTS } from "@/config/serviceEndpoints";
import { createQueryCache } from "@/infrastructure/queryCache";
import { serviceClient } from "@/infrastructure/serviceClient";
import type { LookupItem } from "@/types/common.schema";

// לרשימות הסיבות עדיין אין חוזה בסכמה: הפעולות והתשובה (מערך LookupItem, ספק 00 §6) זמניות (ראו pending-decisions)
type GetReasonsResponse = LookupItem<number>[];

/** רשימת סיבות לכל פעולה (ספק 00 §6) */
export type ReasonListKey = "traineeRestriction" | "phoneException" | "voiceMessage";

const REASON_LIST_ENDPOINTS: Record<ReasonListKey, string> = {
  traineeRestriction: SERVICE_ENDPOINTS.lookups.getTraineeRestrictionReasons,
  phoneException: SERVICE_ENDPOINTS.lookups.getPhoneExceptionReasons,
  voiceMessage: SERVICE_ENDPOINTS.lookups.getVoiceMessageReasons,
};

// רשימות הסיבות קבועות, ולכן נשמרות עד רענון הדף
const reasonsCache = createQueryCache<ReasonListKey, LookupItem<number>[]>((listKey) => listKey);

export async function getReasons(listKey: ReasonListKey): Promise<LookupItem<number>[]> {
  const reasons = await serviceClient.get<GetReasonsResponse>(REASON_LIST_ENDPOINTS[listKey]);
  reasonsCache.set(listKey, reasons);
  return reasons;
}

export function getCachedReasons(listKey: ReasonListKey): LookupItem<number>[] | null {
  return reasonsCache.get(listKey);
}
