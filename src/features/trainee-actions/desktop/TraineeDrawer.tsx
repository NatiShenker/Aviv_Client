import { useState } from "react";
import { IpsIconButton } from "ui-library";
import { formatPersonalNumber } from "@/features/trainee/traineeDisplay";
import TraineePhoto from "@/features/trainee/TraineePhoto";
import { TRAINEE_TEXTS } from "@/features/trainee/traineeTexts";
import AppIcon from "@/shared/components/AppIcon";
import { LiveAnnouncerProvider } from "@/shared/components/LiveAnnouncer";
import ScreenStateMessage from "@/shared/components/ScreenStateMessage";
import { DRAWER_ROW_GUTTER_CLASS } from "@/shells/desktop/drawer/drawerSpacing";
import SideDrawer from "@/shells/desktop/drawer/SideDrawer";
import { UnsavedChangesReporter } from "@/shells/desktop/drawer/unsavedChanges";
import UnsavedChangesDialog from "@/shells/desktop/drawer/UnsavedChangesDialog";
import type { TraineeListItemDto } from "@/types/trainees.schema";
import { TRAINEE_ACTIONS_TEXTS } from "../traineeActionsTexts";
import DrawerScreens from "./DrawerScreens";
import type { TraineeDrawerScreen } from "./traineeDrawerScreens";

const TEXTS = TRAINEE_ACTIONS_TEXTS;

interface TraineeDrawerProps {
  isOpen: boolean;
  /** מתחלף בכל פתיחה, כדי שכל פתיחה תתחיל מחדש */
  openingKey: number;
  /** המסך שהפתיחה מתחילה בו: מסך הפעולות, או היסטוריה של פעולה (מתפריט ⋮ שעל הכרטיס) */
  initialScreen: TraineeDrawerScreen;
  /** החניך מתוך רשימת החניכים. null = הוא כבר לא ברשימה */
  trainee: TraineeListItemDto | null;
  onClose: () => void;
  /** אחרי כל שמירה בטופס שבמגירה - למשל כדי שרשימת החניכים שמאחור תתעדכן */
  onRecordSaved: () => void;
  /** בסוף אנימציית הסגירה */
  onExited: () => void;
}

/**
 * מגירת החניך בדסקטופ: כותרת קבועה עם החניך, ומתחתיה מסך הפעולות או המסך של פעולה (ספק 02 ואילך).
 * המגירה עצמה נשארת mounted, כדי שגם הפתיחה הראשונה תונפש; התוכן מתחיל מחדש בכל פתיחה.
 * סגירה (רקע, Escape, X) כשבטופס הפתוח יש שינויים שואלת קודם; החץ ו"ביטול" של הטופס עצמו לא (OQ-16)
 */
export default function TraineeDrawer({
  isOpen,
  openingKey,
  initialScreen,
  trainee,
  onClose,
  onRecordSaved,
  onExited,
}: TraineeDrawerProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);

  const requestClose = () => {
    if (hasUnsavedChanges) {
      setIsLeaveConfirmOpen(true);
      return;
    }
    onClose();
  };

  const leaveWithoutSaving = () => {
    setIsLeaveConfirmOpen(false);
    onClose();
  };

  return (
    <>
      <SideDrawer
        open={isOpen}
        onRequestClose={requestClose}
        onExited={onExited}
        renderHeader={({ titleId, requestClose: requestCloseFromHeader }) => (
          <TraineeDrawerHeader trainee={trainee} titleId={titleId} onClose={requestCloseFromHeader} />
        )}
      >
        {trainee === null ? (
          <div className={DRAWER_ROW_GUTTER_CLASS}>
            <ScreenStateMessage message={TRAINEE_TEXTS.notFound} />
          </div>
        ) : (
          <UnsavedChangesReporter onChange={setHasUnsavedChanges}>
            {/* המגירה מודאלית ומסתירה מקורא המסך את הטוסט - הודעת השמירה מוכרזת גם כאן */}
            <LiveAnnouncerProvider>
              <DrawerScreens
                key={openingKey}
                trainee={trainee}
                initialScreen={initialScreen}
                onRecordSaved={onRecordSaved}
              />
            </LiveAnnouncerProvider>
          </UnsavedChangesReporter>
        )}
      </SideDrawer>

      <UnsavedChangesDialog
        open={isLeaveConfirmOpen}
        onKeepEditing={() => setIsLeaveConfirmOpen(false)}
        onLeaveWithoutSaving={leaveWithoutSaving}
      />
    </>
  );
}

interface TraineeDrawerHeaderProps {
  trainee: TraineeListItemDto | null;
  /** המזהה שהמגירה מקשרת אליו כשם הנגיש שלה */
  titleId: string;
  onClose: () => void;
}

// הרמה העליונה בהיררכיה של המגירה (ספק 02 §8.3): תמונה כמו בכרטיס, השם (20, מודגש) ומתחתיו המספר האישי
// באפור - כמו בכרטיס - וסגירה. בלי תגית סטטוס (הוחלט 2026-10-21)
function TraineeDrawerHeader({ trainee, titleId, onClose }: TraineeDrawerHeaderProps) {
  return (
    <header className={`flex shrink-0 items-start gap-4 border-b border-divider py-5 ${DRAWER_ROW_GUTTER_CLASS}`}>
      {trainee && <TraineePhoto traineeId={trainee.idntTrainee} />}
      <div className="min-w-0 flex-1 pt-1">
        {trainee ? (
          <>
            <h2 id={titleId} title={trainee.textFullName} className="truncate text-xl font-medium text-text-primary">
              {trainee.textFullName}
            </h2>
            <p className="mt-0.5 text-sm text-text-secondary">{formatPersonalNumber(trainee.numbPersonalNumber)}</p>
          </>
        ) : (
          // החניך כבר לא ברשימה: ההודעה מוצגת מתחת לכותרת, וכאן היא רק השם הנגיש של המגירה
          <h2 id={titleId} className="sr-only">
            {TRAINEE_TEXTS.notFound}
          </h2>
        )}
      </div>
      <IpsIconButton
        edge="end"
        icon={<AppIcon name="close" />}
        aria-label={TEXTS.drawer.close}
        tooltip={TEXTS.drawer.close}
        onClick={onClose}
      />
    </header>
  );
}
