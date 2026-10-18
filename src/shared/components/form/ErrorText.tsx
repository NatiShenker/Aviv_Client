interface ErrorTextProps {
  /** בלי הודעה - לא מוצג כלום */
  message?: string;
}

/** שגיאה של קבוצת שדות (למשל זוג תאריכים), מתחת לקבוצה. מוקראת מיד על ידי קורא מסך (ספק 00 §3.5) */
export default function ErrorText({ message }: ErrorTextProps) {
  if (!message) {
    return null;
  }
  return (
    <p role="alert" className="mt-1 text-xs text-error">
      {message}
    </p>
  );
}
