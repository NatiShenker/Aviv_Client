import { HTTP_STATUS } from "@/infrastructure/http/httpStatus";
import type {
  GetInstitutesAndWingsRequest,
  GetInstitutesAndWingsResponse,
  GetPermissionsForInstituteRequest,
  GetPermissionsForInstituteResponse,
} from "@/schemas/organization.schema";
import { INSTITUTES_MOCK_DATA } from "../data/institutesMockData";
import { PERMISSIONS_BY_INSTITUTE_MOCK_DATA } from "../data/permissionsMockData";
import { MockHandlerError, type MockRequest } from "../mockRequest";
import type { MockScenarios } from "../mockScenarios";

// במוק המשתמש מורשה לכל הפנימיות של הקליינט. השרת האמיתי מסנן לפי ההרשאות שלו
export function handleGetInstitutesAndWings(
  request: MockRequest,
  scenarios: MockScenarios,
): GetInstitutesAndWingsResponse {
  const { clientIds } = request.body as GetInstitutesAndWingsRequest;
  const clientInstitutes = INSTITUTES_MOCK_DATA.filter((institute) => clientIds.includes(institute.clientId));
  const institutes = scenarios.singleInstitute ? clientInstitutes.slice(0, 1) : clientInstitutes;
  return { institutes };
}

export function handleGetPermissionsForInstitute(request: MockRequest): GetPermissionsForInstituteResponse {
  const { instituteId } = request.params as GetPermissionsForInstituteRequest;
  const permissionIds = PERMISSIONS_BY_INSTITUTE_MOCK_DATA[instituteId];

  if (!permissionIds) {
    throw new MockHandlerError(HTTP_STATUS.forbidden, {
      code: "FORBIDDEN",
      message: `No permissions for institute ${instituteId}`,
    });
  }
  return permissionIds;
}
