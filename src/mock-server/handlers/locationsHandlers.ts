import type {
  GetLocationsAndVirtualLocationsRequest,
  GetLocationsAndVirtualLocationsResponse,
} from "@/types/organization.schema";
import { LOCATIONS_MOCK_DATA } from "../data/locationsMockData";
import type { MockRequest } from "../mockRequest";

export function handleGetLocationsAndVirtualLocations(
  request: MockRequest,
): GetLocationsAndVirtualLocationsResponse {
  const { clientIds, instituteIds, wingIds } = request.body as GetLocationsAndVirtualLocationsRequest;

  const locations = LOCATIONS_MOCK_DATA.filter(
    (location) =>
      clientIds.includes(location.clientId) &&
      instituteIds.includes(location.instituteId) &&
      wingIds.includes(location.wingId),
  );
  return { locations };
}
