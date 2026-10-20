import { useEffect, useId, useRef, type MutableRefObject, type ReactNode } from "react";
import { IpsIconButton } from "ui-library";
import AppIcon from "@/shared/components/AppIcon";
import { useIsFormLayerLeaving } from "./drawerFormLeaving";
import { DRAWER_FORM_TEXTS } from "./drawerFormTexts";
import { DRAWER_ROW_GUTTER_CLASS, DRAWER_SCROLL_AREA_CLASS } from "./drawerSpacing";

interface DrawerFormLayerProps {
  title: string;
  /** החץ: חזרה למסך שמתחת בלי שמירה */
  onClose: () => void;
  /** הפוטר הקבוע בתחתית (למשל "ביטול" ו"שמור") */
  footer: ReactNode;
  children: ReactNode;
}

/**
 * טופס בתוך מגירה: שורת כותרת עם חץ חזרה, גוף נגלל ופוטר קבוע בתחתית - המקבילה של גיליון הטופס במובייל.
 * חץ ולא X: ה-X היחיד במגירה סוגר את המגירה, וכל מסך פנימי חוזר אחורה בחץ (design.md › Side drawer).
 * כשהטופס נפתח הפוקוס עובר אליו, וכשהוא נסגר הפוקוס חוזר לכפתור שפתח אותו
 */
export default function DrawerFormLayer({ title, onClose, footer, children }: DrawerFormLayerProps) {
  const titleId = useId();
  const layerRef = useRef<HTMLElement>(null);
  const isLeaving = useIsFormLayerLeaving();
  // הכפתור שפתח את הטופס: בזמן הרינדור הראשון הפוקוס עוד עליו
  const openerRef = useRef(document.activeElement);
  const hasReturnedFocusRef = useRef(false);

  useEffect(() => {
    // בלי גלילה: הטופס עדיין באמצע ההחלקה פנימה, והדפדפן היה מנסה "להביא אותו לתצוגה"
    layerRef.current?.focus({ preventScroll: true });
    const opener = openerRef.current;
    return () => returnFocusOnce(opener, hasReturnedFocusRef);
  }, []);

  useEffect(() => {
    if (isLeaving) {
      returnFocusOnce(openerRef.current, hasReturnedFocusRef);
    }
  }, [isLeaving]);

  return (
    <section
      ref={layerRef}
      role="region"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="flex min-h-0 flex-1 flex-col outline-none"
    >
      <div className={`flex shrink-0 items-center gap-2 border-b border-divider py-3 ${DRAWER_ROW_GUTTER_CLASS}`}>
        <IpsIconButton
          edge="start"
          icon={<AppIcon name="back" />}
          aria-label={DRAWER_FORM_TEXTS.backWithoutSaving}
          onClick={onClose}
        />
        <h3 id={titleId} className="min-w-0 truncate text-lg font-medium text-text-primary">
          {title}
        </h3>
      </div>

      <div className={`min-h-0 flex-1 ${DRAWER_SCROLL_AREA_CLASS}`}>{children}</div>

      <div className={`shrink-0 border-t border-divider py-3 ${DRAWER_ROW_GUTTER_CLASS}`}>{footer}</div>
    </section>
  );
}

// הפוקוס חוזר פעם אחת בלבד: כשהטופס מתחיל לצאת באנימציה, או כשהוא יורד בלי אנימציה
function returnFocusOnce(opener: Element | null, hasReturnedFocusRef: MutableRefObject<boolean>): void {
  if (hasReturnedFocusRef.current) return;
  hasReturnedFocusRef.current = true;
  // בפריים הבא: אחרי שהמסך שמתחת חוזר להיות זמין (inert מוסר)
  requestAnimationFrame(() => {
    if (opener instanceof HTMLElement && opener.isConnected) {
      opener.focus();
    }
  });
}
