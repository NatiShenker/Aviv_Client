import type { ReactNode } from "react";
import DrawerPane from "./DrawerPane";
import { SCREEN_ENTER_CLASS, SCREEN_EXIT_CLASS, type DrawerSlideDirection } from "./drawerScreenMotion";

export interface DrawerTransitionScreen {
  /** מזהה יציב של המסך: המסך שיוצא נשאר אותו מופע (עם המצב שלו) עד סוף היציאה */
  key: string;
  content: ReactNode;
}

interface DrawerScreenTransitionProps {
  current: DrawerTransitionScreen;
  /** המסך הקודם, עד סוף אנימציית היציאה שלו. null = אין מסך יוצא */
  leaving: DrawerTransitionScreen | null;
  direction: DrawerSlideDirection;
  /** בסוף היציאה - כדי שמי שמחזיק את המסכים יסיר את המסך היוצא */
  onLeavingDone: () => void;
}

/**
 * מעבר בין מסכים בתוך המגירה: המסך הקודם נדחף החוצה והחדש מחליק פנימה (ספק 02 §8.5).
 * המסך החדש בזרימה וממלא את הגובה; היוצא הוא שכבה באותו מקום, ולא זמין למקלדת ולעכבר
 */
export default function DrawerScreenTransition({ current, leaving, direction, onLeavingDone }: DrawerScreenTransitionProps) {
  // רשימה עם key לכל מסך: כשהמסך הנוכחי הופך ליוצא, React שומר את אותו מופע
  const panes = [
    ...(leaving ? [{ screen: leaving, isLeaving: true }] : []),
    { screen: current, isLeaving: false },
  ];

  return (
    // clip ולא hidden: למכולה עם hidden עדיין יש גלילה מתוכנתת, ומעבר פוקוס למסך שנכנס משמאל (קדימה, RTL)
    // היה גולל אותה הצידה באמצע ההחלקה. clip לא יוצר אזור גלילה בכלל, כמו ב-AppPage במובייל
    <div className="relative flex min-h-0 flex-1 flex-col overflow-clip">
      {panes.map(({ screen, isLeaving }) => (
        <DrawerPane
          key={screen.key}
          layoutClass={isLeaving ? "absolute inset-0" : "flex-1"}
          motionClass={isLeaving ? SCREEN_EXIT_CLASS[direction] : SCREEN_ENTER_CLASS[direction]}
          isInert={isLeaving}
          onOwnAnimationEnd={isLeaving ? onLeavingDone : undefined}
        >
          {screen.content}
        </DrawerPane>
      ))}
    </div>
  );
}
