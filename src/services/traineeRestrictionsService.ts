import { SERVICE_ENDPOINTS } from "@/config/serviceEndpoints";
import { serviceClient } from "@/infrastructure/serviceClient";
import type {
  CreateTraineeRestrictionRequest,
  CreateTraineeRestrictionResponse,
  GetTraineeRestrictionsRequest,
  GetTraineeRestrictionsResponse,
  TraineeRestrictionRecordDto,
  UpdateTraineeRestrictionRequest,
  UpdateTraineeRestrictionResponse,
} from "@/types/trainee-restrictions.schema";
import { clearCachedTrainees } from "./traineesService";

/** כל ההגבלות של החניך, פעילות ושהסתיימו (ספק 03 history §6). בלי זכרון - תמיד מהשרת */
export async function getTraineeRestrictions(traineeId: number): Promise<TraineeRestrictionRecordDto[]> {
  const request: GetTraineeRestrictionsRequest = { traineeIds: [traineeId] };
  const response = await serviceClient.post<GetTraineeRestrictionsResponse>(
    SERVICE_ENDPOINTS.traineeRestrictions.getTraineeRestrictions,
    request,
  );
  return response.records;
}

export async function createTraineeRestriction(
  request: CreateTraineeRestrictionRequest,
): Promise<CreateTraineeRestrictionResponse> {
  const result = await serviceClient.post<CreateTraineeRestrictionResponse>(
    SERVICE_ENDPOINTS.traineeRestrictions.createTraineeRestriction,
    request,
  );
  // התגית "מוגבל עד" והדגלים ברשימת החניכים נגזרים מההגבלות, ולכן הרשימה תיטען מחדש
  clearCachedTrainees();
  return result;
}

export async function updateTraineeRestriction(
  request: UpdateTraineeRestrictionRequest,
): Promise<UpdateTraineeRestrictionResponse> {
  const result = await serviceClient.put<UpdateTraineeRestrictionResponse>(
    SERVICE_ENDPOINTS.traineeRestrictions.updateTraineeRestriction,
    request,
  );
  clearCachedTrainees();
  return result;
}
