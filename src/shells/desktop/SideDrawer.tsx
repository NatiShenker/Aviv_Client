import type { ReactNode } from "react";
import { IpsDrawer, type IpsDrawerCloseReason, type IpsDrawerRenderContext } from "ui-library";
import { isTextEntryElement } from "@/shared/dom/isTextEntryElement";

// רוחב קבוע: הכרטיסים בה רחבים יותר מאשר במובייל, אבל לא מוגזמים (החלטת שלב 2 בדסקטופ)
const SIDE_DRAWER_WIDTH_PX = 480;

// לאזור התוכן של IpsDrawer יש ריווח וגלילה משלו. כאן כל מסך קובע איזה חלק בו נגלל (למשל מעל פוטר קבוע),
// ולכן ההתאמה נעשית במקום השימוש, והפקד בספרייה לא משתנה
const CONTENT_AREA_SX = {
  "& .ips-drawer-content": { p: 0, overflow: "hidden", display: "flex", flexDirection: "column" },
} as const;

interface SideDrawerProps {
  open: boolean;
  /** בקשה לסגור: לחיצה על הרקע, Escape או ה-X. מי שמחזיק את המגירה מחליט אם לסגור */
  onRequestClose: () => void;
  /** בסוף אנימציית הסגירה, אחרי שהפוקוס חזר לאלמנט שפתח את המגירה */
  onExited?: () => void;
  /** הכותרת הקבועה. titleId - למזהה של הכותרת, requestClose - לכפתור הסגירה */
  renderHeader: (context: IpsDrawerRenderContext) => ReactNode;
  /** התוכן ממלא את הגובה שמתחת לכותרת. כל מסך קובע בעצמו איזה חלק בו נגלל */
  children: ReactNode;
}

/**
 * מגירה מודאלית מצד הסוף של המסך (שמאל, ב-RTL), מעל שכבה כהה. הפוקוס נשאר בתוכה,
 * ובסגירה הוא חוזר לאלמנט שפתח אותה
 */
export default function SideDrawer({ open, onRequestClose, onExited, renderHeader, children }: SideDrawerProps) {
  const handleClose = (reason: IpsDrawerCloseReason) => {
    // Escape בתוך שדה טקסט שייך לשדה (למשל לניקוי חיפוש), ולא סוגר את המגירה
    if (reason === "escapeKeyDown" && isTextEntryElement(document.activeElement)) {
      return;
    }
    onRequestClose();
  };

  return (
    <IpsDrawer
      open={open}
      onClose={handleClose}
      anchor="left"
      size={SIDE_DRAWER_WIDTH_PX}
      renderHeader={renderHeader}
      sx={CONTENT_AREA_SX}
      SlideProps={{ onExited }}
    >
      {children}
    </IpsDrawer>
  );
}
