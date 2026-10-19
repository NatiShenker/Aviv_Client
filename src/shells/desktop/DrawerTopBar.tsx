import type { ReactNode } from "react";
import { DRAWER_SIDE_GUTTER_CLASS } from "./drawerSpacing";

interface DrawerTopBarProps {
  /** תחילת השורה, למשל חזרה ושם המסך */
  start: ReactNode;
  /** קצה השורה, למשל הפעולה הראשית של המסך */
  end?: ReactNode;
}

/** השורה העליונה של מסך בתוך מגירה: קבועה, והתוכן שמתחתיה נגלל */
export default function DrawerTopBar({ start, end }: DrawerTopBarProps) {
  return (
    <div className={`flex shrink-0 items-center gap-2 py-2 ${DRAWER_SIDE_GUTTER_CLASS}`}>
      <div className="flex min-w-0 items-center gap-2">{start}</div>
      {end && <div className="ms-auto shrink-0">{end}</div>}
    </div>
  );
}
