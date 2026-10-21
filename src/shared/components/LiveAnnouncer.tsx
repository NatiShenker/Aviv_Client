import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Announce = (message: string) => void;

const LiveAnnouncerContext = createContext<Announce | null>(null);

interface LiveAnnouncerProviderProps {
  children: ReactNode;
}

/**
 * אזור הכרזה נסתר לקורא מסך, בתוך שכבה מודאלית (למשל מגירת החניך בדסקטופ).
 * שכבה מודאלית מסתירה מקורא המסך את כל השאר - גם את הטוסטים - ולכן הודעה שחשוב שתישמע מוכרזת גם כאן.
 * בלי ספק (למשל במובייל) אין הכרזה נוספת, והטוסט לבדו מספיק
 */
export function LiveAnnouncerProvider({ children }: LiveAnnouncerProviderProps) {
  const [message, setMessage] = useState("");

  // ההודעה מתנקה ונכתבת שוב בפריים הבא, כדי שגם אותה הודעה פעמיים ברצף תוכרז
  const announce = useCallback<Announce>((nextMessage) => {
    setMessage("");
    requestAnimationFrame(() => setMessage(nextMessage));
  }, []);

  return (
    <LiveAnnouncerContext.Provider value={announce}>
      {children}
      <p role="status" aria-live="polite" className="sr-only">
        {message}
      </p>
    </LiveAnnouncerContext.Provider>
  );
}

/** ההכרזה של השכבה הנוכחית, או null כשאין */
export function useLiveAnnouncer(): Announce | null {
  return useContext(LiveAnnouncerContext);
}
