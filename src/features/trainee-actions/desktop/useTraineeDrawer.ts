import { useState } from "react";

interface TraineeDrawerState {
  traineeId: number;
  isOpen: boolean;
  /** מתחלף בכל פתיחה, כדי שכל פתיחה תתחיל במסך הפעולות */
  openingKey: number;
}

interface TraineeDrawerControls {
  /** null = המגירה עוד לא נפתחה. אחרי סגירה החניך נשאר, כדי שהתוכן יישאר עד סוף אנימציית הסגירה */
  drawer: TraineeDrawerState | null;
  /** החניך שהמגירה שלו פתוחה עכשיו - לכרטיס הפעיל ברשימה */
  openTraineeId: number | null;
  openDrawer: (traineeId: number) => void;
  closeDrawer: () => void;
}

/** איזו מגירת חניך פתוחה. בזכרון בלבד - הכתובת לא משתנה (החלטת שלב 2 בדסקטופ) */
export function useTraineeDrawer(): TraineeDrawerControls {
  const [drawer, setDrawer] = useState<TraineeDrawerState | null>(null);

  const openDrawer = (traineeId: number) => {
    setDrawer((current) => ({ traineeId, isOpen: true, openingKey: (current?.openingKey ?? 0) + 1 }));
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
