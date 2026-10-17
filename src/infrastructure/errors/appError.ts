import axios, { type AxiosError } from "axios";
import { HTTP_STATUS } from "@/infrastructure/http/httpStatus";

/** קודי השגיאה שהסרביס מחזיר (ספק 00 §7) */
export type ServiceErrorCode =
  | "VALIDATION_ERROR"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "SERVER_ERROR";

/** קודים לכשלים שנוצרים בצד הקליינט */
export type ClientErrorCode = "NETWORK_ERROR" | "CLIENT_ERROR";

export type AppErrorCode = ServiceErrorCode | ClientErrorCode;

/** מאיפה הגיע הכשל: תשובת שגיאה מהסרביס, כשל רשת, או שגיאת קוד בקליינט */
export type AppErrorSource = "service" | "network" | "client";

/** מבנה השגיאה האחיד שהסרביס מחזיר בכל כשל (ספק 00 §7) */
export interface ApiErrorDto {
  code: ServiceErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
}

const SERVICE_ERROR_CODES: ServiceErrorCode[] = [
  "VALIDATION_ERROR",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "SERVER_ERROR",
];

interface AppErrorParams {
  code: AppErrorCode;
  source: AppErrorSource;
  message: string;
  httpStatus?: number | null;
  fieldErrors?: Record<string, string>;
  cause?: unknown;
}

/** השגיאה האחידה של האפליקציה. כל כשל (סרביס, רשת או קליינט) מנורמל אליה */
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly source: AppErrorSource;
  readonly httpStatus: number | null;
  readonly fieldErrors: Record<string, string>;
  readonly cause: unknown;

  constructor({ code, source, message, httpStatus = null, fieldErrors = {}, cause }: AppErrorParams) {
    super(message);
    // שומר על instanceof תקין גם כשהמחלקה מתורגמת לקוד ישן שבו הרחבת Error שוברת את שרשרת ה-prototype
    Object.setPrototypeOf(this, AppError.prototype);
    this.name = "AppError";
    this.code = code;
    this.source = source;
    this.httpStatus = httpStatus;
    this.fieldErrors = fieldErrors;
    this.cause = cause;
  }
}

/** מנרמל כל כשל (שגיאת axios, Error רגיל או ערך כלשהו) ל-AppError */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  if (axios.isAxiosError(error)) {
    return fromAxiosError(error);
  }
  return fromClientError(error);
}

function fromAxiosError(error: AxiosError): AppError {
  const response = error.response;

  // בלי תשובה מהשרת: השרת לא נגיש או שהחיבור נכשל
  if (!response) {
    return new AppError({ code: "NETWORK_ERROR", source: "network", message: error.message, cause: error });
  }

  const body: unknown = response.data;
  if (isApiErrorDto(body)) {
    return new AppError({
      code: body.code,
      source: "service",
      message: body.message,
      httpStatus: response.status,
      fieldErrors: body.fieldErrors,
      cause: error,
    });
  }

  return new AppError({
    code: serviceCodeFromHttpStatus(response.status),
    source: "service",
    message: error.message,
    httpStatus: response.status,
    cause: error,
  });
}

function fromClientError(error: unknown): AppError {
  const message = error instanceof Error ? error.message : String(error);
  return new AppError({ code: "CLIENT_ERROR", source: "client", message, cause: error });
}

function isApiErrorDto(value: unknown): value is ApiErrorDto {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<ApiErrorDto>;
  return (
    typeof candidate.message === "string" &&
    SERVICE_ERROR_CODES.includes(candidate.code as ServiceErrorCode)
  );
}

function serviceCodeFromHttpStatus(status: number): ServiceErrorCode {
  switch (status) {
    case HTTP_STATUS.badRequest:
      return "VALIDATION_ERROR";
    case HTTP_STATUS.forbidden:
      return "FORBIDDEN";
    case HTTP_STATUS.notFound:
      return "NOT_FOUND";
    case HTTP_STATUS.conflict:
      return "CONFLICT";
    default:
      return "SERVER_ERROR";
  }
}
