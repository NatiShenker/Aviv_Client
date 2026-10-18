import ScreenStateMessage from "@/shared/components/ScreenStateMessage";
import { INSTITUTES_TEXTS } from "./institutesTexts";
import type { PermissionCheck } from "./usePermissionCheck";

interface PermissionBlockedMessageProps {
  /** הבדיקה שנכשלה: ההרשאות לא נטענו (error) או שאין הרשאה (denied) */
  permission: PermissionCheck;
}

/** מוצג במקום תוכן המסך כשאי אפשר להציג אותו בגלל ההרשאות */
export default function PermissionBlockedMessage({ permission }: PermissionBlockedMessageProps) {
  if (permission.status === "error") {
    return (
      <ScreenStateMessage
        tone="error"
        message={INSTITUTES_TEXTS.permissionsLoadFailed}
        actionLabel={INSTITUTES_TEXTS.retry}
        onAction={permission.reload}
      />
    );
  }
  return <ScreenStateMessage message={INSTITUTES_TEXTS.noPermissionForAction} />;
}
