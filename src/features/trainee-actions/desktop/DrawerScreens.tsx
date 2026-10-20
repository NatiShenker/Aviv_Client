import { useEffect, useRef, useState, type ReactNode } from "react";
import type { DrawerSlideDirection } from "@/shells/desktop/drawer/drawerScreenMotion";
import DrawerScreenTransition from "@/shells/desktop/drawer/DrawerScreenTransition";
import type { TraineeListItemDto } from "@/types/trainees.schema";
import { prefersReducedMotion } from "@/utils/dom";
import { TRAINEE_ACTIONS_TEXTS } from "../traineeActionsTexts";
import DrawerActionHistoryScreen from "./DrawerActionHistoryScreen";
import DrawerActionsScreen from "./DrawerActionsScreen";
import { ACTIONS_SCREEN, drawerScreenKeyOf, type TraineeDrawerScreen } from "./traineeDrawerScreens";

const TEXTS = TRAINEE_ACTIONS_TEXTS;

interface DrawerScreensProps {
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
export default function DrawerScreens({ trainee, initialScreen, onRecordSaved }: DrawerScreensProps) {
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
        <DrawerActionHistoryScreen
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
