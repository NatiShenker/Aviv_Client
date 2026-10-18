import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

const ONE_STEP_BACK = -1;

/**
 * חזרה למסך הקודם (חץ "חזרה", סגירת טופס): צעד אחורה בהיסטוריה, כדי שהעמוד ייכנס מהכיוון של "חזרה"
 * ולא תיווצר רשומה כפולה. כל מסך פנימי נפתח מתוך האפליקציה (כניסה ישירה מתחילה ממסך הפתיחה),
 * ולכן תמיד יש לאן לחזור.
 */
export function useNavigateBack(): () => void {
  const navigate = useNavigate();
  return useCallback(() => navigate(ONE_STEP_BACK), [navigate]);
}
