import type { DeviceDto } from "@/schemas/organization.schema";
import { getCachedInstituteDevices, getInstituteDevices } from "@/services/devicesService";
import { useAsyncResource, type AsyncResource } from "@/shared/hooks/useAsyncResource";

/** מכשירי הפנימייה ל"מכשירים מותרים". בדרך כלל כבר נטענו ברקע אחרי רשימת החניכים (ספק 00 §6) */
export function useInstituteDevices(instituteId: number | null): AsyncResource<DeviceDto[]> {
  return useAsyncResource({
    requestKey: instituteId,
    load: getInstituteDevices,
    readCache: getCachedInstituteDevices,
  });
}
