import { SERVICE_ENDPOINTS } from "@/config/serviceEndpoints";
import { serviceClient } from "@/infrastructure/serviceClient";
import type { GetTraineePhotoRequest } from "@/types/trainees.schema";

/** כתובת תמונת החניך, לשימוש ישיר ב-src. הדפדפן טוען אותה רק כשהתמונה מוצגת */
export function getTraineePhotoUrl(traineeId: number): string {
  const params: GetTraineePhotoRequest = { traineeId };
  return serviceClient.buildServiceUrl(SERVICE_ENDPOINTS.trainees.getTraineePhoto, params);
}
