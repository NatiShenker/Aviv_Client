import { SERVICE_ENDPOINTS } from "@/config/serviceEndpoints";
import { serviceClient } from "@/infrastructure/serviceClient";
import type {
  CreateTraineeVoiceMessageRequest,
  CreateTraineeVoiceMessageResponse,
  GetTraineeVoiceMessagesRequest,
  GetTraineeVoiceMessagesResponse,
  TraineeVoiceMessageRecordDto,
  UpdateTraineeVoiceMessageRequest,
  UpdateTraineeVoiceMessageResponse,
} from "@/types/voice-messages.schema";
import { clearCachedTrainees } from "./traineesService";

const ENDPOINTS = SERVICE_ENDPOINTS.voiceMessages;

/** כל ההודעות לנמען של החניך, פעילות ושהסתיימו (ספק 05 history §6). בלי זכרון - תמיד מהשרת */
export async function getTraineeVoiceMessages(traineeId: number): Promise<TraineeVoiceMessageRecordDto[]> {
  const request: GetTraineeVoiceMessagesRequest = { traineeIds: [traineeId] };
  const response = await serviceClient.post<GetTraineeVoiceMessagesResponse>(ENDPOINTS.getTraineeVoiceMessages, request);
  return response.records;
}

// הדגלים "הודעה רגילה" ו"הודעה חוזרת" ברשימת החניכים נגזרים מההודעות, ולכן הרשימה תיטען מחדש אחרי כל שמירה

export async function createTraineeVoiceMessage(
  request: CreateTraineeVoiceMessageRequest,
): Promise<CreateTraineeVoiceMessageResponse> {
  const result = await serviceClient.post<CreateTraineeVoiceMessageResponse>(ENDPOINTS.createTraineeVoiceMessage, request);
  clearCachedTrainees();
  return result;
}

export async function updateTraineeVoiceMessage(
  request: UpdateTraineeVoiceMessageRequest,
): Promise<UpdateTraineeVoiceMessageResponse> {
  const result = await serviceClient.put<UpdateTraineeVoiceMessageResponse>(ENDPOINTS.updateTraineeVoiceMessage, request);
  clearCachedTrainees();
  return result;
}
