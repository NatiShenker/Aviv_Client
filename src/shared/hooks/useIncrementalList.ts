import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LIST_PAGE_SIZE } from "@/constants/appConstants";

interface IncrementalListOptions {
  pageSize?: number;
  /** כמה פריטים להציג מיד (למשל בחזרה למסך, כדי לשחזר את מה שכבר הוצג) */
  initialVisibleCount?: number | null;
}

interface IncrementalList<TItem> {
  visibleItems: TItem[];
  hasMore: boolean;
  showMore: () => void;
}

/** מציג רשימה בהדרגה בצד הקליינט: עמוד אחד בהתחלה, ועוד עמוד בכל קריאה ל-showMore */
export function useIncrementalList<TItem>(
  items: TItem[],
  { pageSize = LIST_PAGE_SIZE, initialVisibleCount }: IncrementalListOptions = {},
): IncrementalList<TItem> {
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount ?? pageSize);
  const previousItemsRef = useRef(items);

  // רשימה חדשה (חיפוש, סינון, מיון או פנימייה אחרת) מתחילה שוב מהעמוד הראשון.
  // הרשימה של הרינדור הראשון נשארת עם הכמות ההתחלתית
  useEffect(() => {
    if (previousItemsRef.current === items) return;
    previousItemsRef.current = items;
    setVisibleCount(pageSize);
  }, [items, pageSize]);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = visibleCount < items.length;
  const showMore = useCallback(() => setVisibleCount((count) => count + pageSize), [pageSize]);

  return { visibleItems, hasMore, showMore };
}
