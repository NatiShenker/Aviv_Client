import type { ReactNode } from "react";

interface StickyActionBarProps {
  children: ReactNode;
}

/**
 * פס הפעולה שבתחתית המסך (ספק 00 §3.26).
 * sticky ולא fixed: הפס חלק מהעמוד, ולכן זז יחד איתו כשהעמוד נכנס מהצד.
 * צריך להיות הילד האחרון של AppPage, כדי ש-mt-auto ידחוף אותו לתחתית גם כשהתוכן קצר.
 */
export default function StickyActionBar({ children }: StickyActionBarProps) {
  return <div className="sticky bottom-0 mt-auto bg-background px-4 pb-6 pt-3">{children}</div>;
}
