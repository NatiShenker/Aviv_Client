import type { LookupItem } from "@/schemas/common.schema";
import { getCachedReasons, getReasons, type ReasonListKey } from "@/services/reasonsService";
import { useAsyncResource, type AsyncResource } from "@/shared/hooks/useAsyncResource";

/** רשימת הסיבות של הטופס ("סיבות והחלטה", ספק 00 §4.3). נשמרת אחרי הטעינה הראשונה */
export function useReasons(listKey: ReasonListKey): AsyncResource<LookupItem<number>[]> {
  return useAsyncResource({ requestKey: listKey, load: getReasons, readCache: getCachedReasons });
}
