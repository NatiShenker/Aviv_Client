import { IpsButton, IpsDialog } from "ui-library";
import { DRAWER_FORM_TEXTS } from "./drawerFormTexts";

const TEXTS = DRAWER_FORM_TEXTS.unsavedChanges;

interface UnsavedChangesDialogProps {
  open: boolean;
  /** "המשך עריכה", Escape או הרקע: חזרה לטופס */
  onKeepEditing: () => void;
  onLeaveWithoutSaving: () => void;
}

/**
 * "לצאת בלי לשמור?" - כשסוגרים את המגירה ובטופס יש שינויים (החלטת שלב 2 בדסקטופ).
 * מימין "המשך עריכה" (משני), שמקבל את הפוקוס כי הוא הפעולה הפחות הרסנית (WAI-ARIA APG);
 * משמאל "יציאה בלי שמירה" (ראשי, בצבע שגיאה) - פעולת האישור אחרונה, כמו "שמור" בפוטר הטופס
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
