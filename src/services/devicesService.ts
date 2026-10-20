import { SERVICE_ENDPOINTS } from "@/config/serviceEndpoints";
import { createQueryCache, idsKey } from "@/infrastructure/queryCache";
import { serviceClient } from "@/infrastructure/serviceClient";
import type {
  DeviceDto,
  GetInstituteDevicesRequest,
  GetInstituteDevicesResponse,
} from "@/types/organization.schema";

// המכשירים כמעט לא משתנים, ולכן נשמרים עד רענון הדף (ספק 00 §6)
const devicesCache = createQueryCache<number[], DeviceDto[]>(idsKey);

/** מכשירי הפנימייה, לבחירת "מכשירים מותרים" בטפסים */
export async function getInstituteDevices(instituteId: number): Promise<DeviceDto[]> {
  const request: GetInstituteDevicesRequest = { instituteIds: [instituteId] };
  const response = await serviceClient.post<GetInstituteDevicesResponse>(
    SERVICE_ENDPOINTS.devices.getInstituteDevices,
    request,
  );
  devicesCache.set(request.instituteIds, response.devices);
  return response.devices;
}

export function getCachedInstituteDevices(instituteId: number): DeviceDto[] | null {
  return devicesCache.get([instituteId]);
}

/**
 * טעינה ברקע מיד אחרי שרשימת החניכים נטענה (ספק 00 §6), כדי שהטופס ייפתח עם המכשירים.
 * כשל כאן לא מוצג - הוא כבר דווח, והטופס יטען שוב ויציג את המצב במקום שבו הוא משנה.
 */
export function prefetchInstituteDevices(instituteId: number): void {
  if (getCachedInstituteDevices(instituteId)) return;
  getInstituteDevices(instituteId).catch(() => undefined);
}
