import type { AxiosRequestConfig } from "axios";
import type { ApiErrorDto } from "@/infrastructure/errors/appError";
import type { HttpMethod } from "@/infrastructure/http/httpClient";
import { HTTP_STATUS } from "@/infrastructure/http/httpStatus";
import type { MockScenarioKey, MockScenarios } from "./mockScenarios";

// החוזה בין השרת המדומה ל-handlers. קובץ נפרד מ-mockServer, כדי שה-handlers לא ייבאו את השרת (ייבוא מעגלי)

export interface MockRequest {
  method: HttpMethod;
  url: string;
  /** פרמטרים של GET */
  params?: unknown;
  /** גוף של POST / PUT */
  body?: unknown;
  config?: AxiosRequestConfig;
}

export interface MockRoute {
  method: HttpMethod;
  url: string;
  /** קבוצת הנתונים, לכיוון תרחישי שגיאה / ריק */
  scenarioKey: MockScenarioKey;
  /** מחזיר את גוף התשובה, או זורק MockHandlerError */
  handle: (request: MockRequest, scenarios: MockScenarios) => unknown;
  /** גוף תשובה תקין וריק, לתרחיש mockEmpty */
  createEmptyResponse: () => unknown;
}

/** משאב שהדפדפן טוען ישירות מכתובת (למשל תמונה ב-src), ולא דרך http().get */
export interface MockResourceRoute {
  url: string;
  /** מפתח התרחיש (mockError / mockNetworkError) שמדמה משאב שלא נטען */
  scenarioKey: MockScenarioKey;
  /** מחזיר כתובת שהדפדפן יכול לטעון, או כתובת שלא קיימת כדי לדמות 404 */
  resolveUri: (params: unknown) => string;
  /** כתובת שלא נטענת, כשהתרחיש של המשאב פעיל */
  unavailableUri: string;
}

/** נזרקת מ-handler כדי שהשרת המדומה יחזיר תשובת שגיאה (סטטוס + גוף בצורת ApiErrorDto) */
export class MockHandlerError extends Error {
  readonly status: number;
  readonly body: ApiErrorDto;

  constructor(status: number, body: ApiErrorDto) {
    super(body.message);
    // שומר על instanceof תקין גם כשהמחלקה מתורגמת לקוד ישן
    Object.setPrototypeOf(this, MockHandlerError.prototype);
    this.name = "MockHandlerError";
    this.status = status;
    this.body = body;
  }
}

/**
 * 400 של השרת (A-13, C-4): הקוד, שם השדה כהודעה, ואותו שדה עם טקסט ריק ב-fieldErrors -
 * ההודעות בעברית נשארות בקליינט
 */
export function throwValidationError(fieldName: string): never {
  throw new MockHandlerError(HTTP_STATUS.badRequest, {
    code: "VALIDATION_ERROR",
    message: fieldName,
    fieldErrors: { [fieldName]: "" },
  });
}

/** 409 של השרת (A-2): הרשומה שהבקשה מפנה אליה כבר אינה תקפה - לא קיימת, הוחלפה או הסתיימה. אותו גוף כמו 400 */
export function throwConflictError(fieldName: string): never {
  throw new MockHandlerError(HTTP_STATUS.conflict, {
    code: "CONFLICT",
    message: fieldName,
    fieldErrors: { [fieldName]: "" },
  });
}
