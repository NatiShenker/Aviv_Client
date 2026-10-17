// נקודת ההחלפה היחידה לשרת האמיתי: כשהספרייה הפנימית תהיה זמינה, הייבוא כאן יוחלף בייבוא ממנה,
// ותיקיית mock-server תימחק. ה-services ורכיבי התצוגה לא משתנים.
export { http, initHttpClient } from "./httpClient";
export type { HttpClient, HttpMethod } from "./httpClient";
export { HTTP_STATUS } from "./httpStatus";
