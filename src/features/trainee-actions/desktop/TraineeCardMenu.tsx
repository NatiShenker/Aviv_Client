import { IpsMenu, type IpsMenuValue } from "ui-library";
import AppIcon from "@/shared/components/AppIcon";
import { useInstitutes } from "@/store/institutesContext";
import { TRAINEE_ACTIONS_TEXTS } from "../traineeActionsTexts";
import { buildTraineeCardMenuEntries } from "./traineeCardMenuLogic";
import type { TraineeDrawerScreen } from "./traineeDrawerScreens";

interface TraineeCardMenuProps {
  /** "שם, מספר", לשם הנגיש של הכפתור */
  traineeAccessibleName: string;
  /** פותח את מגירת החניך על המסך שנבחר */
  onOpenScreen: (screen: TraineeDrawerScreen) => void;
}

/**
 * תפריט ⋮ על כרטיס חניך בדסקטופ (ספק 02 §8.1): גישה ישירה לפעולה, בלי לעבור במסך הפעולות.
 * הבחירה מדווחת אחרי שהתפריט נסגר והפוקוס חזר ל-⋮, ולכן סגירת המגירה מחזירה את הפוקוס אליו
 */
export default function TraineeCardMenu({ traineeAccessibleName, onOpenScreen }: TraineeCardMenuProps) {
  const { permissions } = useInstitutes();
  const entries = buildTraineeCardMenuEntries(permissions.data ?? []);

  const handleSelect = (value: IpsMenuValue) => {
    const chosenEntry = entries.find((entry) => entry.value === value);
    if (chosenEntry) {
      onOpenScreen(chosenEntry.screen);
    }
  };

  return (
    <IpsMenu
      icon={<AppIcon name="more" />}
      label={TRAINEE_ACTIONS_TEXTS.cardMenu.label(traineeAccessibleName)}
      size="small"
      items={entries.map((entry) => ({
        value: entry.value,
        label: entry.label,
        icon: <AppIcon name={entry.icon} />,
        dividerBefore: entry.hasDividerBefore,
      }))}
      onSelect={handleSelect}
    />
  );
}
