import type { AppIconName } from "@/shared/components/appIcons";
import { buildPermittedTraineeMenu } from "../traineeActionsLogic";
import { TRAINEE_ACTIONS_TEXTS } from "../traineeActionsTexts";
import { ACTIONS_SCREEN, drawerActionKeyOf, type TraineeDrawerScreen } from "./traineeDrawerScreens";

const ALL_ACTIONS_VALUE = "allActions";

/** פריט בתפריט ⋮ שעל כרטיס החניך, והמסך שהוא פותח במגירה */
export interface TraineeCardMenuEntry {
  value: string;
  label: string;
  icon: AppIconName;
  screen: TraineeDrawerScreen;
  /** קו מפריד מעל הפריט */
  hasDividerBefore: boolean;
}

/**
 * תפריט ⋮ (ספק 02 §8.1): הפעולות המותרות שיש להן מסך במגירה, כל אחת ישר להיסטוריה שלה, ובסוף "כל הפעולות".
 * כשאין הרשאות (עדיין בטעינה, שגיאה, או בלי פעולה מותרת) נשאר רק "כל הפעולות", ומסך הפעולות מציג את המצב
 */
export function buildTraineeCardMenuEntries(permissionIds: number[]): TraineeCardMenuEntry[] {
  const actionEntries = buildPermittedTraineeMenu(permissionIds).actionItems.flatMap((item): TraineeCardMenuEntry[] => {
    const actionKey = drawerActionKeyOf(item.key);
    if (actionKey === null) {
      return [];
    }
    return [
      { value: item.key, label: item.label, icon: item.icon, screen: { name: "history", actionKey }, hasDividerBefore: false },
    ];
  });

  const allActionsEntry: TraineeCardMenuEntry = {
    value: ALL_ACTIONS_VALUE,
    label: TRAINEE_ACTIONS_TEXTS.cardMenu.allActions,
    icon: "allActions",
    screen: ACTIONS_SCREEN,
    hasDividerBefore: actionEntries.length > 0,
  };

  return [...actionEntries, allActionsEntry];
}
