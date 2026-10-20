import { useRef, type AnimationEvent, type ReactNode } from "react";
import { useInert } from "@/shared/hooks/useInert";

interface DrawerPaneProps {
  /** המיקום במכולה: בזרימה, או שכבה מעל מסך אחר */
  layoutClass: string;
  /** אנימציית הכניסה או היציאה, אם יש */
  motionClass: string;
  /** מסך שיוצא, או מסך שמתחת לטופס, לא זמין למקלדת, לעכבר ולקורא מסך */
  isInert: boolean;
  /** בסוף אנימציה של המסך עצמו */
  onOwnAnimationEnd?: () => void;
  children: ReactNode;
}

/** מסך אחד במגירה, כשכבה שאפשר להחליק פנימה והחוצה */
export default function DrawerPane({ layoutClass, motionClass, isInert, onOwnAnimationEnd, children }: DrawerPaneProps) {
  const paneRef = useRef<HTMLDivElement>(null);
  useInert(paneRef, isInert);

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    // אנימציות של רכיבים בתוך המסך (למשל שדה שמופיע) מבעבעות עד לכאן; רק האנימציה של המסך עצמו נחשבת
    if (event.target === event.currentTarget) {
      onOwnAnimationEnd?.();
    }
  };

  return (
    <div ref={paneRef} className={`flex min-h-0 flex-col ${layoutClass} ${motionClass}`} onAnimationEnd={handleAnimationEnd}>
      {children}
    </div>
  );
}
