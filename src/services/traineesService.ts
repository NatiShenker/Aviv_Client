import { createQueryCache, idsKey } from "@/infrastructure/api/queryCache";
import { serviceClient } from "@/infrastructure/api/serviceClient";
import type {
  GetTraineesRequest,
  GetTraineesResponse,
  TraineeListItemDto,
} from "@/schemas/trainees.schema";
import { SERVICE_ENDPOINTS } from "./serviceEndpoints";

// הרשימה האחרונה לכל צירוף פנימיות. גם מסכי החניך (ספק 02 ואילך) קוראים ממנה
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

/** אחרי פעולה שמשנה נתונים שהרשימה נגזרת מהם (למשל הגבלה), כדי שהרשימה תיטען מחדש מהשרת */
export function clearCachedTrainees(): void {
  traineesCache.clear();
}

export interface TraineeLookup {
  instituteId: number;
  traineeId: number;
}

/**
 * חניך אחד מתוך רשימת הפנימייה (ספק 02 §6): מהרשימה שכבר נטענה, ואם אין כזו
 * (למשל רענון במסך חניך) - טוען את רשימת הפנימייה. null = אין חניך כזה בפנימייה.
 */
export async function findTrainee({ instituteId, traineeId }: TraineeLookup): Promise<TraineeListItemDto | null> {
  const trainees = getCachedTrainees([instituteId]) ?? (await getTrainees([instituteId]));
  return findById(trainees, traineeId);
}

/** החניך מהרשימה שכבר נטענה, או null כשהרשימה עוד לא נטענה או שהחניך לא בה */
export function getCachedTrainee({ instituteId, traineeId }: TraineeLookup): TraineeListItemDto | null {
  const trainees = getCachedTrainees([instituteId]);
  return trainees ? findById(trainees, traineeId) : null;
}

function findById(trainees: TraineeListItemDto[], traineeId: number): TraineeListItemDto | null {
  return trainees.find((trainee) => trainee.id === traineeId) ?? null;
}
