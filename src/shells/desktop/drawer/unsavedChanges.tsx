import { createContext, useContext, useEffect, type ReactNode } from "react";

type ReportUnsavedChanges = (hasUnsavedChanges: boolean) => void;

const UnsavedChangesContext = createContext<ReportUnsavedChanges | null>(null);

interface UnsavedChangesReporterProps {
  /** מקבל true כשבטופס שמתחת יש שינויים שלא נשמרו, ו-false כשאין (או כשהטופס נסגר) */
  onChange: ReportUnsavedChanges;
  children: ReactNode;
}

/** המגירה שומעת כאן מהטופס שבתוכה אם יש בו שינויים, כדי לשאול לפני שהיא נסגרת */
export function UnsavedChangesReporter({ onChange, children }: UnsavedChangesReporterProps) {
  return <UnsavedChangesContext.Provider value={onChange}>{children}</UnsavedChangesContext.Provider>;
}

interface UnsavedChangesMuteProps {
  isMuted: boolean;
  children: ReactNode;
}

/**
 * טופס שנסגר ועדיין יוצא באנימציה כבר לא נחשב פתוח: הדיווח שלו מושתק, והמגירה מקבלת "אין שינויים".
 * כך לחיצה על הרקע מיד אחרי "שמירה" או "ביטול" לא שואלת על טופס שכבר נסגר
 */
export function UnsavedChangesMute({ isMuted, children }: UnsavedChangesMuteProps) {
  const report = useContext(UnsavedChangesContext);
  return <UnsavedChangesContext.Provider value={isMuted ? null : report}>{children}</UnsavedChangesContext.Provider>;
}

/** טופס מדווח אם יש בו שינויים שלא נשמרו. כשהוא נסגר - אין יותר שינויים */
export function useReportUnsavedChanges(hasUnsavedChanges: boolean): void {
  const report = useContext(UnsavedChangesContext);

  useEffect(() => {
    report?.(hasUnsavedChanges);
  }, [report, hasUnsavedChanges]);

  useEffect(() => {
    return () => report?.(false);
  }, [report]);
}
