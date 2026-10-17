import type { AppErrorCode } from "./appError";

/** הודעה כללית למשתמש לכל קוד שגיאה. מסכים יכולים להציג במקומה טקסט ספציפי להקשר */
export const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  VALIDATION_ERROR: "חלק מהנתונים אינם תקינים",
  FORBIDDEN: "אין לך הרשאה לבצע פעולה זו",
  NOT_FOUND: "הפריט המבוקש לא נמצא",
  CONFLICT: "הנתונים השתנו מאז שהמסך נטען. יש לרענן ולנסות שוב",
  SERVER_ERROR: "אירעה שגיאה בשרת. נסה שוב מאוחר יותר",
  NETWORK_ERROR: "אין חיבור לשרת. בדוק את החיבור ונסה שוב",
  CLIENT_ERROR: "אירעה שגיאה בלתי צפויה",
};

export const ERROR_SCREEN_TEXTS = {
  title: "משהו השתבש",
  description: "אירעה שגיאה בלתי צפויה במסך.",
  reload: "טעינה מחדש",
} as const;
