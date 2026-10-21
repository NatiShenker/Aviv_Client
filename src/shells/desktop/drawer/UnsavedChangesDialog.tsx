import { IpsButton, IpsDialog } from "ui-library";
import { prefersReducedMotion } from "@/utils/dom";
import { DRAWER_FORM_TEXTS } from "./drawerFormTexts";

const TEXTS = DRAWER_FORM_TEXTS.unsavedChanges;

const NO_TRANSITION_MS = 0;

/*
 * התאמות במקום השימוש - IpsDialog קיים בספרייה לפני אביב, ולכן הוא לא משתנה (design.md › Button pairs):
 * - הכפתורים באותו ריווח מהשוליים כמו הטקסט (24), ולא 8;
 * - שני הכפתורים באותו גובה: כפתור מתאר גבוה מכפתור מלא בעובי המסגרת שלו, ולכן הם נמתחים לגובה השורה;
 * - הכותרת 18, כמו כותרות הגיליונות - לא 20, הגודל של שם החניך בכותרת המגירה
 */
const DIALOG_SX = {
  "& .ips-dialog-title": { fontSize: "18px" },
  "& .ips-dialog-actions": { px: 3, pb: 3, alignItems: "stretch" },
} as const;

interface UnsavedChangesDialogProps {
  open: boolean;
  /** "המשך עריכה", Escape או הרקע: חזרה לטופס */
  onKeepEditing: () => void;
  onLeaveWithoutSaving: () => void;
}

/**
 * "לצאת ללא שמירה?" - כשסוגרים את המגירה ובטופס יש שינויים (החלטת שלב 2 בדסקטופ).
 * מימין "המשך עריכה" (משני), שמקבל את הפוקוס כי הוא הפעולה הפחות הרסנית (WAI-ARIA APG);
 * משמאל "יציאה ללא שמירה" (ראשי, בצבע שגיאה) - פעולת האישור אחרונה, כמו "שמירה" בפוטר הטופס
 */
export default function UnsavedChangesDialog({ open, onKeepEditing, onLeaveWithoutSaving }: UnsavedChangesDialogProps) {
  return (
    <IpsDialog
      open={open}
      onClose={onKeepEditing}
      title={TEXTS.title}
      showCloseButton={false}
      maxWidth="xs"
      fullWidth
      sx={DIALOG_SX}
      // בהעדפת "הפחתת תנועה" - בלי אנימציית פתיחה וסגירה
      transitionDuration={prefersReducedMotion() ? NO_TRANSITION_MS : undefined}
      actions={
        <>
          <IpsButton variant="outlined" autoFocus onClick={onKeepEditing}>
            {TEXTS.keepEditing}
          </IpsButton>
          <IpsButton variant="contained" color="error" onClick={onLeaveWithoutSaving}>
            {TEXTS.leaveWithoutSaving}
          </IpsButton>
        </>
      }
    >
      <p className="text-base text-text-primary">{TEXTS.message}</p>
    </IpsDialog>
  );
}
