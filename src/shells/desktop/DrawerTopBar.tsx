import type { ReactNode } from "react";
import { DRAWER_ROW_GUTTER_CLASS } from "./drawerSpacing";

interface DrawerTopBarProps {
  /** הניווט: חזרה ושם המסך */
  children: ReactNode;
}

/**
 * השורה העליונה של מסך בתוך מגירה: קבועה, והתוכן שמתחתיה נגלל.
 * רק ניווט - הפעולה הראשית של המסך יושבת בשורת המקטע שמתחתיה, כדי שהשורה הזו תישאר שקטה (design.md › Side drawer)
 */
export default function DrawerTopBar({ children }: DrawerTopBarProps) {
  return <div className={`flex shrink-0 items-center gap-2 py-3 ${DRAWER_ROW_GUTTER_CLASS}`}>{children}</div>;
}
