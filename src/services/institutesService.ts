import { AVIV_CLIENT_ID } from "@/constants/appConstants";
import { serviceClient } from "@/infrastructure/api/serviceClient";
import type {
  GetInstitutesAndWingsRequest,
  GetInstitutesAndWingsResponse,
  GetPermissionsForInstituteRequest,
  GetPermissionsForInstituteResponse,
  InstituteWithWingsDto,
} from "@/schemas/organization.schema";
import { SERVICE_ENDPOINTS } from "./serviceEndpoints";

/** הפנימיות שהמשתמש מורשה אליהן, וכל אחת עם האגפים שלה */
export async function getInstitutesAndWings(): Promise<InstituteWithWingsDto[]> {
  const request: GetInstitutesAndWingsRequest = { clientIds: [AVIV_CLIENT_ID] };
  const response = await serviceClient.post<GetInstitutesAndWingsResponse>(
    SERVICE_ENDPOINTS.institutions.getInstitutionsAndWings,
    request,
  );
  return response.institutes;
}

/** מזהי ההרשאות של המשתמש בפנימייה אחת */
export async function getPermissionsForInstitute(instituteId: number): Promise<number[]> {
  const request: GetPermissionsForInstituteRequest = { instituteId, clientIds: [AVIV_CLIENT_ID] };
  return serviceClient.get<GetPermissionsForInstituteResponse>(
    SERVICE_ENDPOINTS.institutions.getPermissionsForInstitution,
    request,
  );
}
