import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiErrorDto } from "@/infrastructure/errors/appError";
import { HTTP_STATUS } from "@/infrastructure/http/httpStatus";
import { MockHandlerError, type MockRequest, type MockRoute } from "./mockRequest";
import { findMockResourceRoute, findMockRoute } from "./mockRoutes";
import { readMockScenarios, type MockScenarios } from "./mockScenarios";

/*
 * שרת מדומה: מקבל בקשה בסגנון axios ומחזיר תשובה או שגיאה בסגנון axios, אחרי השהיה.
 * הנתונים נשמרים בזכרון (mock-server/data), ולכן שינויים נשמרים עד רענון הדף.
 */

const SIMULATED_SERVER_ERROR: ApiErrorDto = {
  code: "SERVER_ERROR",
  message: "Simulated server error (mockError)",
};
const NETWORK_ERROR_MESSAGE = "Network Error";
const OK_STATUS_TEXT = "OK";

let activeScenarios: MockScenarios = readMockScenarios("");

/** קורא את התרחישים מהכתובת. נקרא פעם אחת בעליית האפליקציה, כי ניווט בין מסכים מוחק את הפרמטרים */
export function configureMockServer(): void {
  activeScenarios = readMockScenarios(window.location.search);
}

/** התרחישים הפעילים, גם לסימולציות שלא עוברות דרך http() (למשל ההעלאה ל-SharePoint) */
export function getActiveMockScenarios(): MockScenarios {
  return activeScenarios;
}

/** המקבילה של getUri: כתובת שהדפדפן טוען ישירות (למשל תמונה). כתובת בלי נתיב מוק מוחזרת כמו שהיא */
export function resolveMockResourceUri(url: string, params: unknown): string {
  const resourceRoute = findMockResourceRoute(url);
  if (!resourceRoute) {
    return url;
  }
  // למשאב שהדפדפן טוען בעצמו אין תשובת שגיאה: שגיאה או כשל רשת מדומים ככתובת שלא נטענת
  const { errorKeys, networkErrorKeys } = activeScenarios;
  const isUnavailable =
    errorKeys.includes(resourceRoute.scenarioKey) || networkErrorKeys.includes(resourceRoute.scenarioKey);
  return isUnavailable ? resourceRoute.unavailableUri : resourceRoute.resolveUri(params);
}

export async function handleMockRequest<TResponse>(
  request: MockRequest,
): Promise<AxiosResponse<TResponse>> {
  await waitFor(activeScenarios.delayMs);

  const route = findMockRoute(request.method, request.url);
  if (!route) {
    throw createErrorResponse(request, HTTP_STATUS.notFound, {
      code: "NOT_FOUND",
      message: `No mock route for ${request.method} ${request.url}`,
    });
  }

  if (activeScenarios.networkErrorKeys.includes(route.scenarioKey)) {
    throw createNetworkError(request);
  }
  if (activeScenarios.errorKeys.includes(route.scenarioKey)) {
    throw createErrorResponse(request, HTTP_STATUS.internalServerError, SIMULATED_SERVER_ERROR);
  }

  const isEmptyScenario = activeScenarios.emptyKeys.includes(route.scenarioKey);
  const data = isEmptyScenario ? route.createEmptyResponse() : runHandler(route, request);
  return createSuccessResponse(request, data as TResponse);
}

function runHandler(route: MockRoute, request: MockRequest): unknown {
  try {
    return route.handle(request, activeScenarios);
  } catch (error) {
    if (error instanceof MockHandlerError) {
      throw createErrorResponse(request, error.status, error.body);
    }
    throw error;
  }
}

function waitFor(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function toAxiosConfig(request: MockRequest): InternalAxiosRequestConfig {
  return {
    ...request.config,
    url: request.url,
    method: request.method,
    params: request.params,
    data: request.body,
    headers: new AxiosHeaders(),
  };
}

function createSuccessResponse<TResponse>(request: MockRequest, data: TResponse): AxiosResponse<TResponse> {
  return {
    // עותק, כמו תשובה אמיתית מהרשת: שינוי בתשובה לא משנה את נתוני המוק
    data: structuredClone(data),
    status: HTTP_STATUS.ok,
    statusText: OK_STATUS_TEXT,
    headers: {},
    config: toAxiosConfig(request),
  };
}

function createErrorResponse(request: MockRequest, status: number, body: ApiErrorDto): AxiosError<ApiErrorDto> {
  const config = toAxiosConfig(request);
  const response: AxiosResponse<ApiErrorDto> = { data: body, status, statusText: "", headers: {}, config };
  const errorCode =
    status >= HTTP_STATUS.internalServerError ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST;
  return new AxiosError(`Request failed with status code ${status}`, errorCode, config, undefined, response);
}

function createNetworkError(request: MockRequest): AxiosError {
  return new AxiosError(NETWORK_ERROR_MESSAGE, AxiosError.ERR_NETWORK, toAxiosConfig(request));
}
