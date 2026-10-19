import { useEffect, useRef, type ReactNode } from "react";

interface DrawerFormHostProps {
  /** הטופס הפתוח, או null כשאין טופס */
  formLayer: ReactNode;
  /** המסך שמתחת (למשל ההיסטוריה) */
  children: ReactNode;
}

/**
 * מסך במגירה, ומעליו טופס כשהוא פתוח - כמו גיליון הטופס מעל ההיסטוריה במובייל.
 * המסך שמתחת נשאר mounted, ולכן החיפוש, המיון, הכרטיס הפתוח והגלילה נשמרים; בזמן שהטופס פתוח הוא inert
 */
export default function DrawerFormHost({ formLayer, children }: DrawerFormHostProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const isFormOpen = formLayer !== null;

  useEffect(() => {
    if (screenRef.current) {
      screenRef.current.inert = isFormOpen;
    }
  }, [isFormOpen]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={screenRef} className="flex min-h-0 flex-1 flex-col">
        {children}
      </div>
      {isFormOpen && (
        <div className="absolute inset-0 z-10 flex flex-col bg-paper motion-safe:animate-fade-in">{formLayer}</div>
      )}
    </div>
  );
}
