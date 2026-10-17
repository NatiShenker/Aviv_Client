import { serviceClient } from "@/infrastructure/api/serviceClient";
import type { GetTraineePhotoRequest } from "@/schemas/trainees.schema";
import { SERVICE_ENDPOINTS } from "./serviceEndpoints";

/** כתובת תמונת החניך, לשימוש ישיר ב-src. הדפדפן טוען אותה רק כשהתמונה מוצגת */
export function getTraineePhotoUrl(traineeId: number): string {
  const params: GetTraineePhotoRequest = { traineeId };
  return serviceClient.buildServiceUrl(SERVICE_ENDPOINTS.trainees.getTraineePhoto, params);
}
