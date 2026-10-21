interface ResultsCountLineProps {
  /** הטקסט כשהרשימה מוכנה, למשל "מוצגים 12 חניכים". null - אין מה להציג (שגיאה, אין רשומות, לא נבחרה פנימייה) */
  text: string | null;
  /** בזמן טעינה מוצג שלד במקום הטקסט */
  isLoading: boolean;
  /** מיקום בתוך הסרגל (למשל מרווח) */
  className?: string;
}

/**
 * שורת מספר התוצאות מתחת לכלי החיפוש: שומרת על הגובה שלה בכל מצב, ובזמן טעינה מציגה שלד,
 * כדי שהרשימה שמתחתיה לא תקפוץ כשהנתונים מגיעים.
 * העוטף עם role="status" קיים תמיד, כדי שקורא מסך ישמיע גם את הטקסט הראשון
 */
export default function ResultsCountLine({ text, isLoading, className = "" }: ResultsCountLineProps) {
  return (
    <p role="status" className={`flex h-5 shrink-0 items-center text-sm text-text-muted ${className}`}>
      {isLoading ? (
        <span aria-hidden="true" className="h-3 w-28 rounded-sm bg-grey-100 motion-safe:animate-pulse" />
      ) : (
        text
      )}
    </p>
  );
}
