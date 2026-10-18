import { useEffect, useRef } from "react";

// טוענים את העמוד הבא קצת לפני שהמשתמש מגיע לסוף הרשימה
const PRELOAD_DISTANCE = "200px";

interface LoadMoreSentinelProps {
  renderedCount: number;
  onVisible: () => void;
}

/** סמן בסוף רשימה: כשהוא נכנס לתצוגה, מבקש את העמוד הבא */
export default function LoadMoreSentinel({ renderedCount, onVisible }: LoadMoreSentinelProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onVisibleRef = useRef(onVisible);
  onVisibleRef.current = onVisible;

  // ה-observer נוצר מחדש אחרי כל עמוד, כי סמן שנשאר בתצוגה (רשימה קצרה) לא מדווח שוב בלי זה
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onVisibleRef.current();
        }
      },
      { rootMargin: PRELOAD_DISTANCE },
    );
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [renderedCount]);

  return <div ref={sentinelRef} aria-hidden="true" className="h-px" />;
}
