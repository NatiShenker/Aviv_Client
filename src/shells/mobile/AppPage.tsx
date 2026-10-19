import { useEffect, useState, type ReactNode } from "react";
import { useNavigationType } from "react-router-dom";
import {
  isFirstPageOfSession,
  markPageRendered,
  resolvePageEnterDirection,
  type PageEnterDirection,
} from "./navigation/pageTransition";

// שמות מחלקות מלאים, כדי ש-Tailwind ימצא אותם בסריקה. בהעדפת "הפחתת תנועה" אין אנימציה
const ENTER_ANIMATION_CLASS: Record<PageEnterDirection, string> = {
  forward: "motion-safe:animate-page-enter-forward",
  back: "motion-safe:animate-page-enter-back",
  none: "",
};

interface AppPageProps {
  children: ReactNode;
  className?: string;
}

/**
 * השורש של כל מסך: כיוון RTL, רקע, ואנימציית הכניסה של העמוד.
 * הכיוון נקבע פעם אחת כשהמסך עולה, ולכן שינוי כתובת בתוך אותו מסך (למשל פתיחת מגירת טופס) לא מזיז אותו.
 */
export default function AppPage({ children, className = "" }: AppPageProps) {
  const navigationType = useNavigationType();
  const [enterDirection] = useState(() => resolvePageEnterDirection(navigationType, isFirstPageOfSession()));

  useEffect(() => {
    markPageRendered();
  }, []);

  return (
    // חיתוך אופקי בזמן שהעמוד נכנס מהצד. clip (ולא hidden) לא יוצר אזור גלילה, ולכן גלילת החלון ו-sticky לא נפגעים
    <div className="overflow-x-clip">
      <main
        dir="rtl"
        lang="he"
        className={`flex min-h-screen flex-col bg-background text-text-primary ${ENTER_ANIMATION_CLASS[enterDirection]} ${className}`}
      >
        {children}
      </main>
    </div>
  );
}
