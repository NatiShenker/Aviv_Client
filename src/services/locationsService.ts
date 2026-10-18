import { AVIV_CLIENT_ID } from "@/appConstants";
import { createQueryCache, idsKey } from "@/infrastructure/api/queryCache";
import { serviceClient } from "@/infrastructure/api/serviceClient";
import type {
  GetLocationsAndVirtualLocationsRequest,
  GetLocationsAndVirtualLocationsResponse,
  WingLocationDto,
} from "@/schemas/organization.schema";
import { SERVICE_ENDPOINTS } from "./serviceEndpoints";

export interface LocationsQuery {
  instituteIds: number[];
  wingIds: number[];
}

const locationsCache = createQueryCache<LocationsQuery, WingLocationDto[]>(
  ({ instituteIds, wingIds }) => `${idsKey(instituteIds)}|${idsKey(wingIds)}`,
);

/** המיקומים והמיקומים הווירטואליים באגפים שהתבקשו */
export async function getLocationsAndVirtualLocations(query: LocationsQuery): Promise<WingLocationDto[]> {
  const request: GetLocationsAndVirtualLocationsRequest = {
    clientIds: [AVIV_CLIENT_ID],
    instituteIds: query.instituteIds,
    wingIds: query.wingIds,
  };
  const response = await serviceClient.post<GetLocationsAndVirtualLocationsResponse>(
    SERVICE_ENDPOINTS.locations.getLocationsAndVirtualLocations,
    request,
  );
  locationsCache.set(query, response.locations);
  return response.locations;
}

/** המיקומים שכבר נטענו לשאילתה הזו, או null אם עוד לא נטענו */
export function getCachedLocations(query: LocationsQuery): WingLocationDto[] | null {
  return locationsCache.get(query);
}
