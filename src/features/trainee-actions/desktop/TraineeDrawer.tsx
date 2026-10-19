import { useEffect, useRef, useState, type ReactNode } from "react";
import { IpsIconButton } from "ui-library";
import { buildTraineeDisplayName } from "@/features/trainee/traineeDisplay";
import { TRAINEE_TEXTS } from "@/features/trainee/traineeTexts";
import TraineePhoto from "@/features/trainees-list/components/TraineePhoto";
import TraineeStatusBadge from "@/features/trainees-list/components/TraineeStatusBadge";
import type { TraineeListItemDto } from "@/schemas/trainees.schema";
import ScreenStateMessage from "@/shared/components/ScreenStateMessage";
import AppIcon from "@/shared/icons/AppIcon";
import { DRAWER_SIDE_GUTTER_CLASS } from "@/shells/desktop/drawerSpacing";
import SideDrawer from "@/shells/desktop/SideDrawer";
import UnsavedChangesDialog from "@/shells/desktop/UnsavedChangesDialog";
import { UnsavedChangesReporter } from "@/shells/desktop/unsavedChanges";
import { TRAINEE_ACTIONS_TEXTS } from "../traineeActionsTexts";
import DrawerActionScreen from "./DrawerActionScreen";
import DrawerActionsScreen from "./DrawerActionsScreen";
import { ACTIONS_SCREEN, type TraineeDrawerScreen } from "./traineeDrawerScreens";

const TEXTS = TRAINEE_ACTIONS_TEXTS;

interface TraineeDrawerProps {
  isOpen: boolean;
  /** מתחלף בכל פתיחה, כדי שכל פתיחה תתחיל במסך הפעולות */
  openingKey: number;
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
 * סגירה (רקע, Escape, X) כשבטופס הפתוח יש שינויים שואלת קודם; X ו"ביטול" של הטופס עצמו לא (OQ-16)
 */
export default function TraineeDrawer({
  isOpen,
  openingKey,
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
          <div className={DRAWER_SIDE_GUTTER_CLASS}>
            <ScreenStateMessage message={TRAINEE_TEXTS.notFound} />
          </div>
        ) : (
          <UnsavedChangesReporter onChange={setHasUnsavedChanges}>
            <TraineeDrawerScreens key={openingKey} trainee={trainee} onRecordSaved={onRecordSaved} />
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

// כותרת קומפקטית, כדי שלמסכים יישאר כמה שיותר גובה: תמונה, "שם | מספר" כמו בכרטיס, תגית הסטטוס וסגירה
function TraineeDrawerHeader({ trainee, titleId, onClose }: TraineeDrawerHeaderProps) {
  return (
    <header className={`flex shrink-0 items-center gap-3 border-b border-divider py-4 ${DRAWER_SIDE_GUTTER_CLASS}`}>
      {trainee && <TraineePhoto traineeId={trainee.id} size="small" />}
      <h2 id={titleId} className="min-w-0 flex-1 truncate text-lg font-medium text-text-primary">
        {trainee ? buildTraineeDisplayName(trainee) : ""}
      </h2>
      {trainee && <TraineeStatusBadge restrictedUntilDate={trainee.restrictedUntilDate ?? null} />}
      <IpsIconButton edge="end" icon={<AppIcon name="close" />} aria-label={TEXTS.drawer.close} onClick={onClose} />
    </header>
  );
}

interface TraineeDrawerScreensProps {
  trainee: TraineeListItemDto;
  onRecordSaved: () => void;
}

// המעבר בין המסכים שבתוך המגירה. מתחיל תמיד במסך הפעולות
function TraineeDrawerScreens({ trainee, onRecordSaved }: TraineeDrawerScreensProps) {
  const [screen, setScreen] = useState<TraineeDrawerScreen>(ACTIONS_SCREEN);
  // בפתיחה הפוקוס בכותרת המגירה; רק מעבר מסך מעביר אותו למסך החדש
  const [hasNavigated, setHasNavigated] = useState(false);

  const navigate = (nextScreen: TraineeDrawerScreen) => {
    setScreen(nextScreen);
    setHasNavigated(true);
  };

  if (screen.name === "actions") {
    return (
      <DrawerScreenRegion key="actions" label={TEXTS.sections.actions} shouldTakeFocus={hasNavigated}>
        <DrawerActionsScreen onSelectAction={(actionKey) => navigate({ name: "history", actionKey })} />
      </DrawerScreenRegion>
    );
  }

  return (
    <DrawerScreenRegion key={screen.actionKey} label={TEXTS.items[screen.actionKey]} shouldTakeFocus={hasNavigated}>
      <DrawerActionScreen
        actionKey={screen.actionKey}
        trainee={trainee}
        onBack={() => navigate(ACTIONS_SCREEN)}
        onSwitchAction={(actionKey) => navigate({ name: "history", actionKey })}
        onRecordSaved={onRecordSaved}
      />
    </DrawerScreenRegion>
  );
}

interface DrawerScreenRegionProps {
  label: string;
  /** אחרי מעבר מסך הפוקוס עובר לכאן, כדי שקורא מסך ישמיע את המסך החדש והמקלדת תמשיך ממנו */
  shouldTakeFocus: boolean;
  children: ReactNode;
}

// מסך אחד במגירה: ממלא את הגובה שמתחת לכותרת. key שונה לכל מסך, ולכן כל מסך מתחיל מלמעלה
function DrawerScreenRegion({ label, shouldTakeFocus, children }: DrawerScreenRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldTakeFocus) {
      regionRef.current?.focus();
    }
  }, [shouldTakeFocus]);

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
