import type { ReactNode } from "react";
import { IpsDialog, IpsIconButton, type IpsDialogRenderContext } from "ui-library";
import AppIcon from "@/shared/components/AppIcon";
import { MOBILE_SHELL_TEXTS } from "./mobileShellTexts";
import { SCREEN_TOP_SPACING_CLASS } from "./screenSpacing";

interface FormSheetProps {
  open: boolean;
  title: string;
  /** X ו-Escape. אין רקע ללחוץ עליו, כי הטופס מכסה את כל המסך */
  onClose: () => void;
  children?: ReactNode;
  /** פוטר הטופס (למשל כפתור השמירה) */
  actions?: ReactNode;
}

/**
 * טופס יצירה / עריכה שעולה מלמטה ומכסה את כל המסך: בלי פינות מעוגלות, בלי ידית ובלי גרירה (ספק 00 §2.4).
 * הכותרת נבנית כאן ולא בכפתור המובנה של הדיאלוג, כדי שה-X יהיה בגודל מגע ועם שם נגיש בעברית.
 */
export default function FormSheet({ open, title, onClose, children, actions }: FormSheetProps) {
  // אותו מבנה כמו הכותרת של עמוד (PinnedPageTop + PageHeader): ריווח עליון, ושורת כותרת עם קו תחתון
  const renderHeader = ({ titleId, requestClose }: IpsDialogRenderContext) => (
    <div className={SCREEN_TOP_SPACING_CLASS}>
      <div className="mx-4 flex items-center justify-between gap-2 border-b border-divider pb-1">
        <h2 id={titleId} className="min-w-0 truncate text-xl font-medium text-text-primary">
          {title}
        </h2>
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

  return (
    <IpsDialog
      open={open}
      onClose={onClose}
      fullScreen
      transition="slide"
      rtl
      renderHeader={renderHeader}
      actions={actions}
    >
      {children}
    </IpsDialog>
  );
}
