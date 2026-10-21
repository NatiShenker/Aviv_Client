import { getCachedInstituteDevices, getInstituteDevices } from "@/services/devicesService";
import { getCachedReasons, getReasons, type ReasonListKey } from "@/services/reasonsService";
import { useAsyncResource, type AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { LookupItem } from "@/types/common.schema";
import type { DeviceDto } from "@/types/organization.schema";

/* נתוני העזר שהטפסים טוענים: רשימת הסיבות ומכשירי הפנימייה */

/** רשימת הסיבות של הטופס ("סיבות ואישורים", ספק 00 §4.3). נשמרת אחרי הטעינה הראשונה */
export function useReasons(listKey: ReasonListKey): AsyncResource<LookupItem<number>[]> {
  return useAsyncResource({ requestKey: listKey, load: getReasons, readCache: getCachedReasons });
}

/** מכשירי הפנימייה ל"מכשירים מותרים". בדרך כלל כבר נטענו ברקע אחרי רשימת החניכים (ספק 00 §6) */
export function useInstituteDevices(instituteId: number | null): AsyncResource<DeviceDto[]> {
  return useAsyncResource({
    requestKey: instituteId,
    load: getInstituteDevices,
    readCache: getCachedInstituteDevices,
  });
}
