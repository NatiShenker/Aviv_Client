import { createQueryCache, idsKey } from "@/infrastructure/api/queryCache";
import { serviceClient } from "@/infrastructure/api/serviceClient";
import type {
  GetTraineesRequest,
  GetTraineesResponse,
  TraineeListItemDto,
} from "@/schemas/trainees.schema";
import { SERVICE_ENDPOINTS } from "./serviceEndpoints";

// הרשימה האחרונה לכל צירוף פנימיות. גם מסך הפעולות של חניך (ספק 02) קורא ממנה
const traineesCache = createQueryCache<number[], TraineeListItemDto[]>(idsKey);

export async function getTrainees(instituteIds: number[]): Promise<TraineeListItemDto[]> {
  const request: GetTraineesRequest = { instituteIds };
  const response = await serviceClient.post<GetTraineesResponse>(SERVICE_ENDPOINTS.trainees.getTrainees, request);
  traineesCache.set(instituteIds, response.trainees);
  return response.trainees;
}

/** הרשימה שכבר נטענה לפנימיות האלה, או null אם עוד לא נטענה */
export function getCachedTrainees(instituteIds: number[]): TraineeListItemDto[] | null {
  return traineesCache.get(instituteIds);
}
