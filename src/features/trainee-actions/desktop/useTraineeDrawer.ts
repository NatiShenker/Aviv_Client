import { useState } from "react";
import { ACTIONS_SCREEN, type TraineeDrawerScreen } from "./traineeDrawerScreens";

interface TraineeDrawerState {
  traineeId: number;
  isOpen: boolean;
  /** מתחלף בכל פתיחה, כדי שכל פתיחה תתחיל מחדש */
  openingKey: number;
  /** המסך שהפתיחה מתחילה בו: מסך הפעולות (הכרטיס), או היסטוריה של פעולה (תפריט ⋮) */
  initialScreen: TraineeDrawerScreen;
}

interface TraineeDrawerControls {
  /** null = המגירה עוד לא נפתחה. אחרי סגירה החניך נשאר, כדי שהתוכן יישאר עד סוף אנימציית הסגירה */
  drawer: TraineeDrawerState | null;
  /** החניך שהמגירה שלו פתוחה עכשיו - לכרטיס הפעיל ברשימה */
  openTraineeId: number | null;
  openDrawer: (traineeId: number, initialScreen?: TraineeDrawerScreen) => void;
  closeDrawer: () => void;
}

/** איזו מגירת חניך פתוחה. בזכרון בלבד - הכתובת לא משתנה (החלטת שלב 2 בדסקטופ) */
export function useTraineeDrawer(): TraineeDrawerControls {
  const [drawer, setDrawer] = useState<TraineeDrawerState | null>(null);

  const openDrawer = (traineeId: number, initialScreen: TraineeDrawerScreen = ACTIONS_SCREEN) => {
    setDrawer((current) => ({ traineeId, isOpen: true, openingKey: (current?.openingKey ?? 0) + 1, initialScreen }));
  };

  const closeDrawer = () => {
    setDrawer((current) => current && { ...current, isOpen: false });
  };

  return {
    drawer,
    openTraineeId: drawer?.isOpen ? drawer.traineeId : null,
    openDrawer,
    closeDrawer,
  };
}
