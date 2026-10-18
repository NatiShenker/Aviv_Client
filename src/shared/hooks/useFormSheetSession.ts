import { useState } from "react";

interface FormSheetSession<TTarget> {
  /** מתחלף בכל פתיחה, כדי שהטופס יתחיל נקי. לא מתחלף בסגירה, כדי שהסגירה תונפש עם התוכן */
  key: number;
  /** הטופס שנפתח (נשמר גם בזמן אנימציית הסגירה, אחרי שהכתובת כבר חזרה) */
  target: TTarget | null;
}

/** "פתיחה" של טופס שנפתח ונסגר לפי הכתובת: מפתח חדש לכל פתיחה, והיעד של אותה פתיחה */
export function useFormSheetSession<TTarget>(target: TTarget | null): FormSheetSession<TTarget> {
  const isOpen = target !== null;
  const [session, setSession] = useState<FormSheetSession<TTarget>>({ key: 0, target });
  const [wasOpen, setWasOpen] = useState(isOpen);

  // עדכון מצב בזמן הרינדור (ולא ב-effect), כדי שהטופס החדש יופיע כבר ברינדור של הפתיחה
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setSession((current) => ({ key: current.key + 1, target }));
    }
  }

  return session;
}
