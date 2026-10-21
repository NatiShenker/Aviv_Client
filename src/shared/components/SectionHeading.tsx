import { createContext, useContext, type ReactNode } from "react";

/** רמת כותרת: h2 עד h6 (h1 שמור לכותרת העמוד) */
export type HeadingLevel = 2 | 3 | 4 | 5 | 6;

const MAX_HEADING_LEVEL: HeadingLevel = 6;

/*
 * רמת הכותרת של מקטעים (בלוק בטופס, מקטע במסך הפעולות) נקבעת לפי המסגרת שהם מוצגים בה, ולא ברכיב עצמו.
 * במובייל המקטעים יושבים מתחת לכותרת העמוד (h1), ולכן ברירת המחדל היא h2.
 * במגירה בדסקטופ יש מעליהם עוד רמות (שם החניך, כותרת המסך), והמגירה מספקת רמה עמוקה יותר - כדי שקורא מסך
 * ישמע את הכותרות בסדר הנכון. המראה לא משתנה: הגודל נקבע ב-className, לא ברמה
 */
const SectionHeadingLevelContext = createContext<HeadingLevel>(2);

interface SectionHeadingLevelProviderProps {
  level: HeadingLevel;
  children: ReactNode;
}

export function SectionHeadingLevelProvider({ level, children }: SectionHeadingLevelProviderProps) {
  return <SectionHeadingLevelContext.Provider value={level}>{children}</SectionHeadingLevelContext.Provider>;
}

/** רמת הכותרת של מקטע במסגרת הנוכחית */
export function useSectionHeadingLevel(): HeadingLevel {
  return useContext(SectionHeadingLevelContext);
}

/** רמה אחת מתחת למקטע - לכותרת של קבוצת שדות בתוך מקטע */
export function useSubsectionHeadingLevel(): HeadingLevel {
  const sectionLevel = useSectionHeadingLevel();
  return sectionLevel === MAX_HEADING_LEVEL ? MAX_HEADING_LEVEL : ((sectionLevel + 1) as HeadingLevel);
}

interface SectionHeadingProps {
  level: HeadingLevel;
  id?: string;
  tabIndex?: number;
  className?: string;
  children: ReactNode;
}

/** כותרת ברמה שנקבעה בזמן ריצה */
export default function SectionHeading({ level, id, tabIndex, className, children }: SectionHeadingProps) {
  const HeadingTag = `h${level}` as const;
  return (
    <HeadingTag id={id} tabIndex={tabIndex} className={className}>
      {children}
    </HeadingTag>
  );
}
