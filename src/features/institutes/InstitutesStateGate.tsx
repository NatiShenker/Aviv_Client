import type { ReactNode } from "react";
import ScreenStateMessage from "@/shared/components/ScreenStateMessage";
import { useInstitutes } from "./InstitutesProvider";
import { INSTITUTES_TEXTS } from "./institutesTexts";

interface InstitutesStateGateProps {
  children: ReactNode;
}

/** מסך שתלוי בפנימייה עולה רק אחרי שרשימת הפנימיות הגיעה. עד אז מוצג מצב הטעינה / השגיאה / הריק */
export default function InstitutesStateGate({ children }: InstitutesStateGateProps) {
  const { institutes } = useInstitutes();

  switch (institutes.status) {
    case "idle":
    case "loading":
      return <ScreenStateMessage message={INSTITUTES_TEXTS.loading} />;
    case "error":
      return (
        <ScreenStateMessage
          tone="error"
          message={INSTITUTES_TEXTS.loadFailed}
          actionLabel={INSTITUTES_TEXTS.retry}
          onAction={institutes.reload}
        />
      );
    case "empty":
      return <ScreenStateMessage message={INSTITUTES_TEXTS.noPermittedInstitutes} />;
    case "success":
      return <>{children}</>;
  }
}
