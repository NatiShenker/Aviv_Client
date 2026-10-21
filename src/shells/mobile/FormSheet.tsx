import type { ReactNode } from "react";
import { IpsDialog, IpsIconButton, type IpsDialogRenderContext } from "ui-library";
import AppIcon from "@/shared/components/AppIcon";
import { MOBILE_SHELL_TEXTS } from "./mobileShellTexts";
import { SCREEN_TOP_SPACING_CLASS } from "./screenSpacing";
import StickyActionBar from "./StickyActionBar";

// לגוף הדיאלוג יש ריווח משלו (24 בצדדים, ברירת המחדל של MUI), שונה מהכותרת ומהפוטר. כאן הוא מתיישר לריווח
// הצד של המסכים (16), והריווח האנכי שייך לבלוקים של הטופס. ההתאמה נעשית במקום השימוש, והפקד בספרייה לא משתנה
const CONTENT_AREA_SX = {
  "& .ips-dialog-content": { px: "16px", py: 0 },
} as const;

interface FormSheetProps {
  open: boolean;
  title: string;
  /** שורת משנה מתחת לכותרת (החניך שעליו פועלים). ריקה - לא מוצגת */
  subtitle?: string;
  /** X ו-Escape. אין רקע ללחוץ עליו, כי הטופס מכסה את כל המסך */
  onClose: () => void;
  children?: ReactNode;
  /** פוטר הטופס (למשל כפתור השמירה) */
  actions?: ReactNode;
}

/**
 * טופס יצירה / עריכה שעולה מלמטה ומכסה את כל המסך: בלי פינות מעוגלות, בלי ידית ובלי גרירה (ספק 00 §2.4).
 * הכותרת נבנית כאן ולא בכפתור המובנה של הדיאלוג, כדי שה-X יהיה בגודל מגע ועם שם נגיש בעברית.
 * הפוטר הוא פס הפעולה של המסכים (StickyActionBar), כך שהכותרת, הבלוקים והכפתורים נגמרים באותו קו
 */
export default function FormSheet({ open, title, subtitle, onClose, children, actions }: FormSheetProps) {
  // אותו מבנה כמו הכותרת של עמוד (PinnedPageTop + PageHeader): ריווח עליון, ושורת כותרת עם קו תחתון.
  // ה-X מיושר לשורת הכותרת גם כשיש מתחתיה שורת משנה
  const renderHeader = ({ titleId, requestClose }: IpsDialogRenderContext) => (
    <div className={SCREEN_TOP_SPACING_CLASS}>
      <div className="mx-4 flex items-start justify-between gap-2 border-b border-divider pb-1">
        <div className="min-w-0 pt-2">
          <h2 id={titleId} className="truncate text-xl font-medium text-text-primary">
            {title}
          </h2>
          {subtitle && <p className="truncate text-sm text-text-secondary">{subtitle}</p>}
        </div>
        <IpsIconButton
          edge="end"
          size="large"
          icon={<AppIcon name="close" />}
          aria-label={MOBILE_SHELL_TEXTS.formSheet.closeWithoutSaving}
          onClick={requestClose}
        />
      </div>
    </div>
  );

  const renderFooter = () => <StickyActionBar>{actions}</StickyActionBar>;

  return (
    <IpsDialog
      open={open}
      onClose={onClose}
      fullScreen
      transition="slide"
      rtl
      renderHeader={renderHeader}
      renderFooter={actions === undefined ? undefined : renderFooter}
      sx={CONTENT_AREA_SX}
    >
      {children}
    </IpsDialog>
  );
}
