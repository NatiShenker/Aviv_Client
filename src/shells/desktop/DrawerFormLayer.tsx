import { useEffect, useId, useRef, type ReactNode } from "react";
import { IpsIconButton } from "ui-library";
import AppIcon from "@/shared/icons/AppIcon";
import { DRAWER_FORM_TEXTS } from "./drawerFormTexts";
import { DRAWER_SIDE_GUTTER_CLASS } from "./drawerSpacing";

interface DrawerFormLayerProps {
  title: string;
  /** ה-X: חזרה למסך שמתחת בלי שמירה */
  onClose: () => void;
  /** הפוטר הקבוע בתחתית (למשל "ביטול" ו"שמור") */
  footer: ReactNode;
  children: ReactNode;
}

/**
 * טופס בתוך מגירה: כותרת עם X, גוף נגלל ופוטר קבוע בתחתית - המקבילה של גיליון הטופס במובייל.
 * כשהוא נפתח הפוקוס עובר אליו, וכשהוא נסגר הפוקוס חוזר לכפתור שפתח אותו
 */
export default function DrawerFormLayer({ title, onClose, footer, children }: DrawerFormLayerProps) {
  const titleId = useId();
  const layerRef = useRef<HTMLElement>(null);
  // הכפתור שפתח את הטופס: בזמן הרינדור הראשון הפוקוס עוד עליו
  const openerRef = useRef(document.activeElement);

  useEffect(() => {
    layerRef.current?.focus();
    const opener = openerRef.current;
    return () => {
      // בפריים הבא: אחרי שהמסך שמתחת חוזר להיות זמין (inert מוסר)
      requestAnimationFrame(() => {
        if (opener instanceof HTMLElement && opener.isConnected) {
          opener.focus();
        }
      });
    };
  }, []);

  return (
    <section
      ref={layerRef}
      role="region"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="flex min-h-0 flex-1 flex-col outline-none"
    >
      <div className={`flex shrink-0 items-center justify-between gap-2 border-b border-divider py-2 ${DRAWER_SIDE_GUTTER_CLASS}`}>
        <h3 id={titleId} className="min-w-0 truncate text-xl font-medium text-text-primary">
          {title}
        </h3>
        <IpsIconButton
          edge="end"
          icon={<AppIcon name="close" />}
          aria-label={DRAWER_FORM_TEXTS.closeWithoutSaving}
          onClick={onClose}
        />
      </div>

      <div className={`min-h-0 flex-1 overflow-y-auto ${DRAWER_SIDE_GUTTER_CLASS}`}>{children}</div>

      <div className={`shrink-0 border-t border-divider py-3 ${DRAWER_SIDE_GUTTER_CLASS}`}>{footer}</div>
    </section>
  );
}
