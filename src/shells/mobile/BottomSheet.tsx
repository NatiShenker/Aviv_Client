import type { ReactNode } from "react";
import { IpsDrawer, IpsIconButton, type IpsDrawerRenderContext } from "ui-library";
import AppIcon from "@/shared/components/AppIcon";
import { MOBILE_SHELL_TEXTS } from "./mobileShellTexts";

// גובה לפי התוכן; המגירה מגבילה את עצמה ל-90% מהמסך ומוסיפה גלילה כשצריך
const SHEET_HEIGHT = "auto";

// השוליים של מגירה תחתונה (ספק 00 §2.3): 20 בצדדים, ו-32 למטה מעל אזור הבטוח של המסך (פס הבית באייפון).
// הכותרת משתמשת באותו ריווח צד (px-5)
const SIDE_PADDING = "20px";
const BOTTOM_PADDING = "calc(32px + env(safe-area-inset-bottom))";

/**
 * לאזור התוכן ולפוטר של IpsDrawer יש ריווח משלהם (16). ההתאמה נעשית כאן, במקום השימוש, והפקד בספרייה לא משתנה.
 * הריווח התחתון שייך לחלק האחרון במגירה: לפוטר כשיש כפתורים, ולתוכן כשאין
 */
function buildSheetSx(hasActions: boolean) {
  return {
    "& .ips-drawer-content": {
      px: SIDE_PADDING,
      ...(hasActions ? {} : { pb: BOTTOM_PADDING }),
    },
    "& .ips-drawer-actions": { px: SIDE_PADDING, pb: BOTTOM_PADDING },
  };
}

interface BottomSheetProps {
  open: boolean;
  title: string;
  /** ה-X, הרקע, Escape וגרירה למטה */
  onClose: () => void;
  children: ReactNode;
  /** פוטר קבוע מתחת לתוכן (למשל "הצגת התוצאות") */
  actions?: ReactNode;
}

/**
 * מגירה תחתונה (ספק 00 §3.24): ידית, כותרת, X משמאל ותוכן שגובהו לפי התוכן.
 * הכותרת נבנית כאן ולא בכותרת המובנית של המגירה, כמו ב-FormSheet: שם ה-X ממוקם ב-left/right ידני
 * ומתהפך פעם נוספת ב-RTL (ראו pending-decisions), והוא גם קטן מגודל מגע
 */
export default function BottomSheet({ open, title, onClose, children, actions }: BottomSheetProps) {
  const renderHeader = ({ titleId, requestClose }: IpsDrawerRenderContext) => (
    <div className="flex shrink-0 items-center justify-between gap-2 px-5">
      <h2 id={titleId} className="min-w-0 truncate text-lg font-medium text-text-primary">
        {title}
      </h2>
      <IpsIconButton
        edge="end"
        size="large"
        icon={<AppIcon name="close" />}
        aria-label={MOBILE_SHELL_TEXTS.bottomSheet.close}
        onClick={requestClose}
      />
    </div>
  );

  return (
    <IpsDrawer
      open={open}
      anchor="bottom"
      size={SHEET_HEIGHT}
      onClose={() => onClose()}
      rtl
      renderHeader={renderHeader}
      actions={actions}
      sx={buildSheetSx(actions !== undefined)}
    >
      {children}
    </IpsDrawer>
  );
}
