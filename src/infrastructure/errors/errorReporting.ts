import { toAppError, type AppError } from "./appError";

const ERROR_CONTEXTS = {
  uncaughtError: "uncaught error",
  unhandledRejection: "unhandled promise rejection",
} as const;

// נקודה אחת לדיווח על שגיאות. כרגע לקונסול; כאן יתחבר שירות לוגים כשיוגדר
export function reportError(error: AppError, context: string): void {
  console.error(`[Aviv] ${context}:`, error);
}

/** תופס שגיאות זמן ריצה שלא טופלו בשום מקום אחר (מחוץ לרינדור של React) */
export function registerGlobalErrorHandlers(): void {
  window.addEventListener("error", (event) => {
    reportError(toAppError(event.error ?? event.message), ERROR_CONTEXTS.uncaughtError);
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportError(toAppError(event.reason), ERROR_CONTEXTS.unhandledRejection);
  });
}
