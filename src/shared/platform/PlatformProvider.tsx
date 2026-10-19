import { createContext, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { resolveLayout, type AppLayout } from "./platformLogic";

/*
 * מודול הפלטפורמה: המקום היחיד שמזהה באיזו סביבה אביב רצה.
 * כרגע רק הפריסה. זיהוי נוסף (למשל iOS או מגע) יתווסף כאן כשיהיה לו צרכן; רכיבים לא בודקים רוחב או userAgent בעצמם.
 */

interface PlatformContextValue {
  layout: AppLayout;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

interface PlatformProviderProps {
  children: ReactNode;
}

/**
 * מודד את המכולה של אביב ומעדכן את הפריסה כשהרוחב חוצה את נקודת השבירה.
 * התוכן מוצג רק אחרי המדידה הראשונה, כדי שמסך דסקטופ לא יהבהב קודם בפריסת מובייל
 */
export function PlatformProvider({ children }: PlatformProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<AppLayout | null>(null);

  // מדידה לפני הציור הראשון, ואחריה מעקב אחרי שינויי גודל. פריסה זהה לא גורמת לרינדור מחדש
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measureLayout = () => setLayout(resolveLayout(container.getBoundingClientRect().width));
    measureLayout();

    const resizeObserver = new ResizeObserver(measureLayout);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const contextValue = useMemo<PlatformContextValue | null>(() => (layout ? { layout } : null), [layout]);

  return (
    <div ref={containerRef}>
      {contextValue && <PlatformContext.Provider value={contextValue}>{children}</PlatformContext.Provider>}
    </div>
  );
}

export function usePlatform(): PlatformContextValue {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error("usePlatform must be used inside PlatformProvider");
  }
  return context;
}
