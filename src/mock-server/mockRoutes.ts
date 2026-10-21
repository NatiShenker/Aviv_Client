import { SERVICE_ENDPOINTS } from "@/config/serviceEndpoints";
import type { HttpMethod } from "@/infrastructure/http/httpClient";
import { APPROVER_STAND_IN_ENDPOINTS } from "@/integrations/approver-mfe/approversStandInService";
import type { ApproverRef, FileAttachmentRef, LookupItem, MutationResultDto } from "@/types/common.schema";
import type {
  GetInstituteDevicesResponse,
  GetInstitutesAndWingsResponse,
  GetLocationsAndVirtualLocationsResponse,
  GetPermissionsForInstituteResponse,
} from "@/types/organization.schema";
import type {
  GetTraineePhoneRecordsResponse,
  LookupPhoneRestrictionsForPermitResponse,
} from "@/types/phone-exceptions.schema";
import type { GetTraineeRestrictionsResponse } from "@/types/trainee-restrictions.schema";
import type { GetTraineesResponse } from "@/types/trainees.schema";
import type { GetTraineeVoiceMessagesResponse } from "@/types/voice-messages.schema";
import { handleSearchApprovers } from "./handlers/approverStandInHandlers";
import { handleRegisterApprovedFile } from "./handlers/filesHandlers";
import {
  handleGetInstitutesAndWings,
  handleGetPermissionsForInstitute,
} from "./handlers/institutionsHandlers";
import { handleGetLocationsAndVirtualLocations } from "./handlers/locationsHandlers";
import {
  handleGetInstituteDevices,
  handleGetPhoneExceptionReasons,
  handleGetTraineeRestrictionReasons,
  handleGetVoiceMessageReasons,
} from "./handlers/lookupsHandlers";
import {
  handleCreateTraineePhonePermit,
  handleCreateTraineePhoneRestriction,
  handleGetTraineePhoneRecords,
  handleLookupPhoneRestrictionsForPermit,
  handleUpdateTraineePhonePermit,
  handleUpdateTraineePhoneRestriction,
} from "./handlers/phoneExceptionsHandlers";
import {
  handleCreateTraineeRestriction,
  handleGetTraineeRestrictions,
  handleUpdateTraineeRestriction,
} from "./handlers/traineeRestrictionsHandlers";
import { MISSING_PHOTO_URL } from "./data/traineePhotosMockData";
import { handleGetTrainees, resolveTraineePhotoUri } from "./handlers/traineesHandlers";
import {
  handleCreateTraineeVoiceMessage,
  handleGetTraineeVoiceMessages,
  handleUpdateTraineeVoiceMessage,
} from "./handlers/voiceMessagesHandlers";
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
  {
    method: "POST",
    url: SERVICE_ENDPOINTS.traineeRestrictions.getTraineeRestrictions,
    scenarioKey: "traineeRestrictions",
    handle: handleGetTraineeRestrictions,
    createEmptyResponse: (): GetTraineeRestrictionsResponse => ({ records: [] }),
  },
  {
    method: "POST",
    url: SERVICE_ENDPOINTS.traineeRestrictions.createTraineeRestriction,
    scenarioKey: "saveTraineeRestriction",
    handle: handleCreateTraineeRestriction,
    createEmptyResponse: createEmptyMutationResult,
  },
  {
    method: "PUT",
    url: SERVICE_ENDPOINTS.traineeRestrictions.updateTraineeRestriction,
    scenarioKey: "saveTraineeRestriction",
    handle: handleUpdateTraineeRestriction,
    createEmptyResponse: createEmptyMutationResult,
  },
  {
    method: "POST",
    url: SERVICE_ENDPOINTS.phoneExceptions.getTraineePhoneRecords,
    scenarioKey: "phoneRecords",
    handle: handleGetTraineePhoneRecords,
    createEmptyResponse: (): GetTraineePhoneRecordsResponse => ({ records: [] }),
  },
  {
    method: "POST",
    url: SERVICE_ENDPOINTS.phoneExceptions.lookupRestrictionsForPermit,
    scenarioKey: "phoneRestrictionsLookup",
    handle: handleLookupPhoneRestrictionsForPermit,
    createEmptyResponse: (): LookupPhoneRestrictionsForPermitResponse => ({ results: [] }),
  },
  {
    method: "POST",
    url: SERVICE_ENDPOINTS.phoneExceptions.createTraineePhoneRestriction,
    scenarioKey: "savePhoneRecord",
    handle: handleCreateTraineePhoneRestriction,
    createEmptyResponse: createEmptyMutationResult,
  },
  {
    method: "PUT",
    url: SERVICE_ENDPOINTS.phoneExceptions.updateTraineePhoneRestriction,
    scenarioKey: "savePhoneRecord",
    handle: handleUpdateTraineePhoneRestriction,
    createEmptyResponse: createEmptyMutationResult,
  },
  {
    method: "POST",
    url: SERVICE_ENDPOINTS.phoneExceptions.createTraineePhonePermit,
    scenarioKey: "savePhoneRecord",
    handle: handleCreateTraineePhonePermit,
    createEmptyResponse: createEmptyMutationResult,
  },
  {
    method: "PUT",
    url: SERVICE_ENDPOINTS.phoneExceptions.updateTraineePhonePermit,
    scenarioKey: "savePhoneRecord",
    handle: handleUpdateTraineePhonePermit,
    createEmptyResponse: createEmptyMutationResult,
  },
  {
    method: "POST",
    url: SERVICE_ENDPOINTS.voiceMessages.getTraineeVoiceMessages,
    scenarioKey: "voiceMessages",
    handle: handleGetTraineeVoiceMessages,
    createEmptyResponse: (): GetTraineeVoiceMessagesResponse => ({ records: [] }),
  },
  {
    method: "POST",
    url: SERVICE_ENDPOINTS.voiceMessages.createTraineeVoiceMessage,
    scenarioKey: "saveVoiceMessage",
    handle: handleCreateTraineeVoiceMessage,
    createEmptyResponse: createEmptyMutationResult,
  },
  {
    method: "PUT",
    url: SERVICE_ENDPOINTS.voiceMessages.updateTraineeVoiceMessage,
    scenarioKey: "saveVoiceMessage",
    handle: handleUpdateTraineeVoiceMessage,
    createEmptyResponse: createEmptyMutationResult,
  },
  {
    method: "POST",
    url: SERVICE_ENDPOINTS.devices.getInstituteDevices,
    scenarioKey: "devices",
    handle: handleGetInstituteDevices,
    createEmptyResponse: (): GetInstituteDevicesResponse => ({ devices: [] }),
  },
  {
    method: "GET",
    url: SERVICE_ENDPOINTS.lookups.getTraineeRestrictionReasons,
    scenarioKey: "reasons",
    handle: handleGetTraineeRestrictionReasons,
    createEmptyResponse: (): LookupItem<number>[] => [],
  },
  {
    method: "GET",
    url: SERVICE_ENDPOINTS.lookups.getPhoneExceptionReasons,
    scenarioKey: "reasons",
    handle: handleGetPhoneExceptionReasons,
    createEmptyResponse: (): LookupItem<number>[] => [],
  },
  {
    method: "GET",
    url: SERVICE_ENDPOINTS.lookups.getVoiceMessageReasons,
    scenarioKey: "reasons",
    handle: handleGetVoiceMessageReasons,
    createEmptyResponse: (): LookupItem<number>[] => [],
  },
  {
    method: "POST",
    url: SERVICE_ENDPOINTS.files.registerApprovedFile,
    scenarioKey: "approvedFiles",
    handle: handleRegisterApprovedFile,
    createEmptyResponse: (): FileAttachmentRef => ({ id: 0, fileName: "" }),
  },
  // סימולציה של ה-MFE של הגורם המאשר - יימחק כשה-MFE ישולב
  {
    method: "GET",
    url: APPROVER_STAND_IN_ENDPOINTS.searchApprovers,
    scenarioKey: "approvers",
    handle: handleSearchApprovers,
    createEmptyResponse: (): ApproverRef[] => [],
  },
];

function createEmptyMutationResult(): MutationResultDto {
  return { createdIds: [], requestUid: "", syncStatus: "pending", records: [] };
}

// משאבים שהדפדפן טוען ישירות מהכתובת (למשל ב-src של תמונה)
const MOCK_RESOURCE_ROUTES: MockResourceRoute[] = [
  {
    url: SERVICE_ENDPOINTS.trainees.getTraineePhoto,
    scenarioKey: "traineePhotos",
    resolveUri: resolveTraineePhotoUri,
    unavailableUri: MISSING_PHOTO_URL,
  },
];

export function findMockRoute(method: HttpMethod, url: string): MockRoute | undefined {
  return MOCK_ROUTES.find((route) => route.method === method && route.url === url);
}

export function findMockResourceRoute(url: string): MockResourceRoute | undefined {
  return MOCK_RESOURCE_ROUTES.find((route) => route.url === url);
}
