import { AVIV_CLIENT_ID } from "@/config/appConstants";
import { SERVICE_ENDPOINTS } from "@/config/serviceEndpoints";
import { createQueryCache, idsKey } from "@/infrastructure/queryCache";
import { serviceClient } from "@/infrastructure/serviceClient";
import type {
  GetLocationsAndVirtualLocationsRequest,
  GetLocationsAndVirtualLocationsResponse,
  WingLocationDto,
} from "@/types/organization.schema";

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
  const locations = await serviceClient.post<GetLocationsAndVirtualLocationsResponse>(
    SERVICE_ENDPOINTS.locations.getLocationsAndVirtualLocations,
    request,
  );
  locationsCache.set(query, locations);
  return locations;
}

/** המיקומים שכבר נטענו לשאילתה הזו, או null אם עוד לא נטענו */
export function getCachedLocations(query: LocationsQuery): WingLocationDto[] | null {
  return locationsCache.get(query);
}
