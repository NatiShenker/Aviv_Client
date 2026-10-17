import type { HttpMethod } from "@/infrastructure/http/httpClient";
import type {
  GetInstitutesAndWingsResponse,
  GetLocationsAndVirtualLocationsResponse,
  GetPermissionsForInstituteResponse,
} from "@/schemas/organization.schema";
import type { GetTraineesResponse } from "@/schemas/trainees.schema";
import { SERVICE_ENDPOINTS } from "@/services/serviceEndpoints";
import {
  handleGetInstitutesAndWings,
  handleGetPermissionsForInstitute,
} from "./handlers/institutionsHandlers";
import { handleGetLocationsAndVirtualLocations } from "./handlers/locationsHandlers";
import { handleGetTrainees, resolveTraineePhotoUri } from "./handlers/traineesHandlers";
import type { MockResourceRoute, MockRoute } from "./mockRequest";

// נתיבי השרת המדומה. נתיבים של מסכים אחרים יתווספו יחד עם המסכים עצמם
const MOCK_ROUTES: MockRoute[] = [
  {
    method: "POST",
    url: SERVICE_ENDPOINTS.institutions.getInstitutionsAndWings,
    scenarioKey: "institutes",
    handle: handleGetInstitutesAndWings,
    createEmptyResponse: (): GetInstitutesAndWingsResponse => ({ institutes: [] }),
  },
  {
    method: "GET",
    url: SERVICE_ENDPOINTS.institutions.getPermissionsForInstitution,
    scenarioKey: "permissions",
    handle: handleGetPermissionsForInstitute,
    createEmptyResponse: (): GetPermissionsForInstituteResponse => [],
  },
  {
    method: "POST",
    url: SERVICE_ENDPOINTS.trainees.getTrainees,
    scenarioKey: "trainees",
    handle: handleGetTrainees,
    createEmptyResponse: (): GetTraineesResponse => ({ trainees: [] }),
  },
  {
    method: "POST",
    url: SERVICE_ENDPOINTS.locations.getLocationsAndVirtualLocations,
    scenarioKey: "locations",
    handle: handleGetLocationsAndVirtualLocations,
    createEmptyResponse: (): GetLocationsAndVirtualLocationsResponse => ({ locations: [] }),
  },
];

// משאבים שהדפדפן טוען ישירות מהכתובת (למשל ב-src של תמונה)
const MOCK_RESOURCE_ROUTES: MockResourceRoute[] = [
  {
    url: SERVICE_ENDPOINTS.trainees.getTraineePhoto,
    resolveUri: resolveTraineePhotoUri,
  },
];

export function findMockRoute(method: HttpMethod, url: string): MockRoute | undefined {
  return MOCK_ROUTES.find((route) => route.method === method && route.url === url);
}

export function findMockResourceRoute(url: string): MockResourceRoute | undefined {
  return MOCK_RESOURCE_ROUTES.find((route) => route.url === url);
}
