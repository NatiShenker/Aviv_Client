import type {
  GetLocationsAndVirtualLocationsRequest,
  GetLocationsAndVirtualLocationsResponse,
} from "@/types/organization.schema";
import { LOCATIONS_MOCK_DATA } from "../data/locationsMockData";
import type { MockRequest } from "../mockRequest";

// כמו SP_AVIV_GET_LOCATIONS: מיקום נכלל כשהפנימייה שלו ברשימה או כשהאגף שלו (parentId) ברשימה; התשובה היא הרשימה עצמה, כמו בסרביס
export function handleGetLocationsAndVirtualLocations(
  request: MockRequest,
): GetLocationsAndVirtualLocationsResponse {
  const { instituteIds, wingIds } = request.body as GetLocationsAndVirtualLocationsRequest;

  return LOCATIONS_MOCK_DATA.filter(
    (location) => instituteIds.includes(location.institutionId) || wingIds.includes(location.parentId),
  );
}
