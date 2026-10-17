import { http } from "@/infrastructure/http";
import { toAppError, type AppError } from "@/infrastructure/errors/appError";
import { reportError } from "@/infrastructure/errors/errorReporting";

/*
 * רכיב הביניים בין ה-services לבין http():
 * מבצע את הפנייה, מחלץ את data מהתשובה, ומנרמל כל כשל ל-AppError (אחרי דיווח).
 * ה-services ניגשים לסרביס רק דרכו.
 */
export const serviceClient = {
  async get<TResponse>(url: string, params?: object): Promise<TResponse> {
    try {
      const response = await http().get<TResponse>(url, { params });
      return response.data;
    } catch (error) {
      throw toReportedAppError(error, url);
    }
  },

  async post<TResponse>(url: string, body: unknown): Promise<TResponse> {
    try {
      const response = await http().post<TResponse>(url, body);
      return response.data;
    } catch (error) {
      throw toReportedAppError(error, url);
    }
  },

  /** הכתובת המלאה של פעולה בסרביס, למשל משאב שמוצג ישירות ב-src של תמונה */
  buildServiceUrl(url: string, params?: object): string {
    return http().getUri({ url, params });
  },
};

function toReportedAppError(error: unknown, url: string): AppError {
  const appError = toAppError(error);
  reportError(appError, url);
  return appError;
}
