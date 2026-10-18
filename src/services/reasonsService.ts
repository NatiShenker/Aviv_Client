import { createQueryCache } from "@/infrastructure/api/queryCache";
import { serviceClient } from "@/infrastructure/api/serviceClient";
import type { LookupItem } from "@/schemas/common.schema";
import { SERVICE_ENDPOINTS } from "./serviceEndpoints";

// לרשימת הסיבות עדיין אין חוזה בסכמה: הפעולה והתשובה (מערך LookupItem, ספק 00 §6) זמניות (ראו pending-decisions)
type GetTraineeRestrictionReasonsResponse = LookupItem<number>[];

const TRAINEE_RESTRICTION_REASONS_KEY = "traineeRestriction";

// רשימת הסיבות קבועה, ולכן נשמרת עד רענון הדף
const reasonsCache = createQueryCache<typeof TRAINEE_RESTRICTION_REASONS_KEY, LookupItem<number>[]>(
  (listKey) => listKey,
);

/** הסיבות של "הגבלה/היתר לחניך" */
export async function getTraineeRestrictionReasons(): Promise<LookupItem<number>[]> {
  const reasons = await serviceClient.get<GetTraineeRestrictionReasonsResponse>(
    SERVICE_ENDPOINTS.lookups.getTraineeRestrictionReasons,
  );
  reasonsCache.set(TRAINEE_RESTRICTION_REASONS_KEY, reasons);
  return reasons;
}

export function getCachedTraineeRestrictionReasons(): LookupItem<number>[] | null {
  return reasonsCache.get(TRAINEE_RESTRICTION_REASONS_KEY);
}
