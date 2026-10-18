import type { LookupItem } from "@/schemas/common.schema";
import type { GetInstituteDevicesRequest, GetInstituteDevicesResponse } from "@/schemas/organization.schema";
import { DEVICES_MOCK_DATA } from "../data/devicesMockData";
import {
  PHONE_EXCEPTION_REASONS_MOCK_DATA,
  TRAINEE_RESTRICTION_REASONS_MOCK_DATA,
  VOICE_MESSAGE_REASONS_MOCK_DATA,
} from "../data/reasonsMockData";
import type { MockRequest } from "../mockRequest";

// רשימות תומכות לטפסים: מכשירי הפנימייה והסיבות

export function handleGetInstituteDevices(request: MockRequest): GetInstituteDevicesResponse {
  const { instituteIds } = request.body as GetInstituteDevicesRequest;
  const devices = DEVICES_MOCK_DATA.filter((device) => instituteIds.includes(device.instituteId));
  return { devices };
}

export function handleGetTraineeRestrictionReasons(): LookupItem<number>[] {
  return TRAINEE_RESTRICTION_REASONS_MOCK_DATA;
}

export function handleGetPhoneExceptionReasons(): LookupItem<number>[] {
  return PHONE_EXCEPTION_REASONS_MOCK_DATA;
}

export function handleGetVoiceMessageReasons(): LookupItem<number>[] {
  return VOICE_MESSAGE_REASONS_MOCK_DATA;
}
