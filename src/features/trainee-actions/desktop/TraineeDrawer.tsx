import { useEffect, useRef, useState, type ReactNode } from "react";
import { IpsIconButton } from "ui-library";
import { buildTraineeDisplayName } from "@/features/trainee/traineeDisplay";
import TraineePhoto from "@/features/trainee/TraineePhoto";
import TraineeStatusBadge from "@/features/trainee/TraineeStatusBadge";
import { TRAINEE_TEXTS } from "@/features/trainee/traineeTexts";
import AppIcon from "@/shared/components/AppIcon";
import ScreenStateMessage from "@/shared/components/ScreenStateMessage";
import type { DrawerSlideDirection } from "@/shells/desktop/drawer/drawerScreenMotion";
import DrawerScreenTransition from "@/shells/desktop/drawer/DrawerScreenTransition";
import { DRAWER_ROW_GUTTER_CLASS } from "@/shells/desktop/drawer/drawerSpacing";
import SideDrawer from "@/shells/desktop/drawer/SideDrawer";
import { UnsavedChangesReporter } from "@/shells/desktop/drawer/unsavedChanges";
import UnsavedChangesDialog from "@/shells/desktop/drawer/UnsavedChangesDialog";
import type { TraineeListItemDto } from "@/types/trainees.schema";
import { prefersReducedMotion } from "@/utils/dom";
import { TRAINEE_ACTIONS_TEXTS } from "../traineeActionsTexts";
import DrawerActionScreen from "./DrawerActionScreen";
import DrawerActionsScreen from "./DrawerActionsScreen";
import { ACTIONS_SCREEN, drawerScreenKeyOf, type TraineeDrawerScreen } from "./traineeDrawerScreens";

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
            <TraineeDrawerScreens
              key={openingKey}
              trainee={trainee}
              initialScreen={initialScreen}
              onRecordSaved={onRecordSaved}
            />
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

// הרמה העליונה בהיררכיה של המגירה (ספק 02 §8.3): תמונה כמו בכרטיס, "שם | מספר" (20, מודגש) ומתחתיו תגית הסטטוס, וסגירה
function TraineeDrawerHeader({ trainee, titleId, onClose }: TraineeDrawerHeaderProps) {
  return (
    <header className={`flex shrink-0 items-start gap-4 border-b border-divider py-5 ${DRAWER_ROW_GUTTER_CLASS}`}>
      {trainee && <TraineePhoto traineeId={trainee.id} />}
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2 pt-1">
        <h2 id={titleId} className="max-w-full truncate text-xl font-medium text-text-primary">
          {trainee ? buildTraineeDisplayName(trainee) : ""}
        </h2>
        {trainee && <TraineeStatusBadge restrictedUntilDate={trainee.restrictedUntilDate ?? null} />}
      </div>
      <IpsIconButton edge="end" icon={<AppIcon name="close" />} aria-label={TEXTS.drawer.close} onClick={onClose} />
    </header>
  );
}

interface TraineeDrawerScreensProps {
  trainee: TraineeListItemDto;
  initialScreen: TraineeDrawerScreen;
  onRecordSaved: () => void;
}

interface ScreenTransition {
  screen: TraineeDrawerScreen;
  /** המסך הקודם, עד סוף אנימציית היציאה שלו */
  leavingScreen: TraineeDrawerScreen | null;
  direction: DrawerSlideDirection;
}

// המעבר בין המסכים שבתוך המגירה (ספק 02 §8.5). המסך הראשון מופיע בלי החלקה - המגירה עצמה מחליקה פנימה
function TraineeDrawerScreens({ trainee, initialScreen, onRecordSaved }: TraineeDrawerScreensProps) {
  const [transition, setTransition] = useState<ScreenTransition>({
    screen: initialScreen,
    leavingScreen: null,
    direction: "none",
  });
  // בפתיחה הפוקוס בכותרת המגירה; רק מעבר מסך מעביר אותו למסך החדש
  const [hasNavigated, setHasNavigated] = useState(false);

  const navigate = (nextScreen: TraineeDrawerScreen, direction: DrawerSlideDirection) => {
    // בלי החלקה, או בהעדפת "הפחתת תנועה" - המסך הקודם יורד מיד
    const keepsLeavingScreen = direction !== "none" && !prefersReducedMotion();
    setTransition((current) => ({
      screen: nextScreen,
      leavingScreen: keepsLeavingScreen ? current.screen : null,
      direction,
    }));
    setHasNavigated(true);
  };

  const finishLeaving = () => {
    setTransition((current) => ({ ...current, leavingScreen: null }));
  };

  const renderScreen = (screen: TraineeDrawerScreen): ReactNode => {
    if (screen.name === "actions") {
      return (
        <DrawerScreenRegion label={TEXTS.sections.actions} takesFocusOnMount={hasNavigated}>
          <DrawerActionsScreen onSelectAction={(actionKey) => navigate({ name: "history", actionKey }, "forward")} />
        </DrawerScreenRegion>
      );
    }

    return (
      <DrawerScreenRegion label={TEXTS.items[screen.actionKey]} takesFocusOnMount={hasNavigated}>
        <DrawerActionScreen
          actionKey={screen.actionKey}
          trainee={trainee}
          onBack={() => navigate(ACTIONS_SCREEN, "back")}
          // החלפת פעולה מחליפה את המסך במקומו, כמו replace במובייל - בלי החלקה
          onSwitchAction={(actionKey) => navigate({ name: "history", actionKey }, "none")}
          onRecordSaved={onRecordSaved}
        />
      </DrawerScreenRegion>
    );
  };

  const { screen, leavingScreen } = transition;
  return (
    <DrawerScreenTransition
      current={{ key: drawerScreenKeyOf(screen), content: renderScreen(screen) }}
      leaving={leavingScreen && { key: drawerScreenKeyOf(leavingScreen), content: renderScreen(leavingScreen) }}
      direction={transition.direction}
      onLeavingDone={finishLeaving}
    />
  );
}

interface DrawerScreenRegionProps {
  label: string;
  /** מסך שעולה אחרי מעבר לוקח את הפוקוס, כדי שקורא מסך ישמיע אותו והמקלדת תמשיך ממנו */
  takesFocusOnMount: boolean;
  children: ReactNode;
}

// מסך אחד במגירה: ממלא את הגובה שמתחת לכותרת, ומתחיל מלמעלה
function DrawerScreenRegion({ label, takesFocusOnMount, children }: DrawerScreenRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);
  // רק בעלייה: מסך שכבר מוצג (למשל המסך שיוצא עכשיו) לא לוקח את הפוקוס
  const [shouldFocusOnMount] = useState(takesFocusOnMount);

  useEffect(() => {
    if (shouldFocusOnMount) {
      // בלי גלילה: המסך עדיין באמצע ההחלקה פנימה, והדפדפן היה מנסה "להביא אותו לתצוגה"
      regionRef.current?.focus({ preventScroll: true });
    }
  }, [shouldFocusOnMount]);

  return (
    <div
      ref={regionRef}
      role="region"
      aria-label={label}
      tabIndex={-1}
      className="flex min-h-0 flex-1 flex-col outline-none"
    >
      {children}
    </div>
  );
}
