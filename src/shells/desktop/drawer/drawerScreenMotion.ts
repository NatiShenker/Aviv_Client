/**
 * כיוון המעבר בין מסכים במגירה: קדימה (החדש נכנס משמאל והקודם נדחף ימינה, RTL), אחורה (הפוך),
 * או בלי החלקה - למשל החלפת פעולה בבורר, כמו replace במובייל (ספק 00 §2.4)
 */
export type DrawerSlideDirection = "forward" | "back" | "none";

// שמות מחלקות מלאים, כדי ש-Tailwind ימצא אותם בסריקה. בהעדפת "הפחתת תנועה" אין אנימציה
export const SCREEN_ENTER_CLASS: Record<DrawerSlideDirection, string> = {
  forward: "motion-safe:animate-page-enter-forward",
  back: "motion-safe:animate-page-enter-back",
  none: "",
};

export const SCREEN_EXIT_CLASS: Record<DrawerSlideDirection, string> = {
  forward: "motion-safe:animate-page-exit-forward",
  back: "motion-safe:animate-page-exit-back",
  none: "",
};
