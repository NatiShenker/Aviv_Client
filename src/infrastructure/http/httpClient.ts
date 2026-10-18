import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { configureMockServer, handleMockRequest, resolveMockResourceUri } from "@/mock-server/mockServer";
import { installSharePointUploadMock } from "@/mock-server/sharePointUploadMock";

/*
 * סימולציה של לקוח ה-HTTP מהספרייה הפנימית, עם אותו ממשק שימוש:
 * initHttpClient() פעם אחת בעליית האפליקציה, ואחר כך await http().post(url, body).
 * כל בקשה מועברת לשרת המוק, שמחזיר תשובה ושגיאה בסגנון axios כמו השרת האמיתי.
 */

export type HttpMethod = "GET" | "POST" | "PUT";

/** הלקוח שמוחזר מ-http() בספרייה הפנימית. תשובה, שגיאה ו-getUri בסגנון axios */
export interface HttpClient {
  get<TResponse>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<TResponse>>;
  post<TResponse>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<TResponse>>;
  put<TResponse>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<TResponse>>;
  /** הכתובת המלאה של בקשה (כולל כתובת הבסיס והפרמטרים), למשל ל-src של תמונה */
  getUri(config?: AxiosRequestConfig): string;
}

let activeClient: HttpClient | null = null;

const mockHttpClient: HttpClient = {
  get<TResponse>(url: string, config?: AxiosRequestConfig) {
    return handleMockRequest<TResponse>({ method: "GET", url, params: config?.params, config });
  },
  post<TResponse>(url: string, body?: unknown, config?: AxiosRequestConfig) {
    return handleMockRequest<TResponse>({ method: "POST", url, body, config });
  },
  put<TResponse>(url: string, body?: unknown, config?: AxiosRequestConfig) {
    return handleMockRequest<TResponse>({ method: "PUT", url, body, config });
  },
  getUri(config?: AxiosRequestConfig) {
    return resolveMockResourceUri(config?.url ?? "", config?.params);
  },
};

export function initHttpClient(): void {
  configureMockServer();
  // ההעלאה ל-SharePoint יוצאת מ-IpsFileUpload ישירות ב-fetch, ולא דרך http(), ולכן מדומה בנפרד
  installSharePointUploadMock();
  activeClient = mockHttpClient;
}

export function http(): HttpClient {
  if (!activeClient) {
    throw new Error("initHttpClient() must be called before http()");
  }
  return activeClient;
}
