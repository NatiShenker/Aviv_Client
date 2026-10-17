import { IpsButton } from "ui-library";

interface ScreenStateMessageProps {
  message: string;
  /** error מוקרא מיד על ידי קורא מסך; status מוקרא ברקע */
  tone?: "status" | "error";
  actionLabel?: string;
  onAction?: () => void;
}

/** הודעת מצב ממורכזת (טעינה, ריק, שגיאה), עם כפתור פעולה אופציונלי כמו "נסה שוב" */
export default function ScreenStateMessage({
  message,
  tone = "status",
  actionLabel,
  onAction,
}: ScreenStateMessageProps) {
  const hasAction = Boolean(actionLabel && onAction);

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className="mt-16 flex flex-col items-center gap-2 px-5 text-center"
    >
      <p className="text-base text-text-muted">{message}</p>
      {hasAction && (
        <IpsButton variant="text" onClick={onAction}>
          {actionLabel}
        </IpsButton>
      )}
    </div>
  );
}
