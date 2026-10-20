import type { AxiosRequestConfig } from "axios";
import type { ApiErrorDto } from "@/infrastructure/errors/appError";
import type { HttpMethod } from "@/infrastructure/http/httpClient";
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
