import { SERVICE_ENDPOINTS } from "@/config/serviceEndpoints";
import { serviceClient } from "@/infrastructure/serviceClient";
import type { PhoneString } from "@/types/common.schema";
import type {
  CreateTraineePhonePermitRequest,
  CreateTraineePhonePermitResponse,
  CreateTraineePhoneRestrictionRequest,
  CreateTraineePhoneRestrictionResponse,
  GetTraineePhoneRecordsRequest,
  GetTraineePhoneRecordsResponse,
  LookupPhoneRestrictionsForPermitRequest,
  LookupPhoneRestrictionsForPermitResponse,
  SourceRestrictionSummaryDto,
  TraineePhoneRecordDto,
  UpdateTraineePhonePermitRequest,
  UpdateTraineePhonePermitResponse,
  UpdateTraineePhoneRestrictionRequest,
  UpdateTraineePhoneRestrictionResponse,
} from "@/types/phone-exceptions.schema";
import { clearCachedTrainees } from "./traineesService";

const ENDPOINTS = SERVICE_ENDPOINTS.phoneExceptions;

/** כל ההגבלות וההיתרים של החניך למספרים, פעילים ושהסתיימו (ספק 04 history §6). בלי זכרון - תמיד מהשרת */
export async function getTraineePhoneRecords(traineeId: number): Promise<TraineePhoneRecordDto[]> {
  const request: GetTraineePhoneRecordsRequest = { traineeIds: [traineeId] };
  const response = await serviceClient.post<GetTraineePhoneRecordsResponse>(ENDPOINTS.getTraineePhoneRecords, request);
  return response.records;
}

export interface PermitRestrictionsLookup {
  traineeId: number;
  instituteId: number;
  phoneNumber: PhoneString;
}

/** ההגבלות שלא הסתיימו החלות על המספר עבור החניך, עם ההיתרים הקיימים שלו עליהן (ספק 04 overview §2.7) */
export async function lookupPhoneRestrictionsForPermit({
  traineeId,
  instituteId,
  phoneNumber,
}: PermitRestrictionsLookup): Promise<SourceRestrictionSummaryDto[]> {
  const request: LookupPhoneRestrictionsForPermitRequest = { traineeId, instituteId, phoneNumbers: [phoneNumber] };
  const response = await serviceClient.post<LookupPhoneRestrictionsForPermitResponse>(
    ENDPOINTS.lookupRestrictionsForPermit,
    request,
  );
  const phoneResult = response.results.find((result) => result.phoneNumber === phoneNumber);
  return phoneResult?.activeRestrictions ?? [];
}

// הדגלים "הגבלה למספר" ו"היתר למספר" ברשימת החניכים נגזרים מהרשומות, ולכן הרשימה תיטען מחדש אחרי כל שמירה

export async function createTraineePhoneRestriction(
  request: CreateTraineePhoneRestrictionRequest,
): Promise<CreateTraineePhoneRestrictionResponse> {
  const result = await serviceClient.post<CreateTraineePhoneRestrictionResponse>(
    ENDPOINTS.createTraineePhoneRestriction,
    request,
  );
  clearCachedTrainees();
  return result;
}

export async function updateTraineePhoneRestriction(
  request: UpdateTraineePhoneRestrictionRequest,
): Promise<UpdateTraineePhoneRestrictionResponse> {
  const result = await serviceClient.put<UpdateTraineePhoneRestrictionResponse>(
    ENDPOINTS.updateTraineePhoneRestriction,
    request,
  );
  clearCachedTrainees();
  return result;
}

export async function createTraineePhonePermit(
  request: CreateTraineePhonePermitRequest,
): Promise<CreateTraineePhonePermitResponse> {
  const result = await serviceClient.post<CreateTraineePhonePermitResponse>(ENDPOINTS.createTraineePhonePermit, request);
  clearCachedTrainees();
  return result;
}

export async function updateTraineePhonePermit(
  request: UpdateTraineePhonePermitRequest,
): Promise<UpdateTraineePhonePermitResponse> {
  const result = await serviceClient.put<UpdateTraineePhonePermitResponse>(ENDPOINTS.updateTraineePhonePermit, request);
  clearCachedTrainees();
  return result;
}
