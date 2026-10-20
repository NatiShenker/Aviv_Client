import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LIST_PAGE_SIZE } from "@/config/appConstants";

interface IncrementalListOptions {
  pageSize?: number;
  /** כמה פריטים להציג מיד (למשל בחזרה למסך, כדי לשחזר את מה שכבר הוצג) */
  initialVisibleCount?: number | null;
  /**
   * מה הופך את הרשימה ל"רשימה חדשה" שמתחילה שוב מהעמוד הראשון, למשל [סינון, מיון].
   * בלי - כל מערך פריטים חדש. עם - רענון של אותה רשימה (אותם סינון ומיון) שומר את כמות הפריטים המוצגים
   */
  resetOn?: readonly unknown[];
}

interface IncrementalList<TItem> {
  visibleItems: TItem[];
  hasMore: boolean;
  showMore: () => void;
}

function haveSameValues(first: readonly unknown[], second: readonly unknown[]): boolean {
  return first.length === second.length && first.every((value, index) => Object.is(value, second[index]));
}

/** מציג רשימה בהדרגה בצד הקליינט: עמוד אחד בהתחלה, ועוד עמוד בכל קריאה ל-showMore */
export function useIncrementalList<TItem>(
  items: TItem[],
  { pageSize = LIST_PAGE_SIZE, initialVisibleCount, resetOn }: IncrementalListOptions = {},
): IncrementalList<TItem> {
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount ?? pageSize);
  const resetValues = resetOn ?? [items];
  const previousResetValuesRef = useRef(resetValues);

  // רשימה חדשה (חיפוש, סינון, מיון או פנימייה אחרת) מתחילה שוב מהעמוד הראשון.
  // הרשימה של הרינדור הראשון נשארת עם הכמות ההתחלתית
  useEffect(() => {
    if (haveSameValues(previousResetValuesRef.current, resetValues)) return;
    previousResetValuesRef.current = resetValues;
    setVisibleCount(pageSize);
  });

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = visibleCount < items.length;
  const showMore = useCallback(() => setVisibleCount((count) => count + pageSize), [pageSize]);

  return { visibleItems, hasMore, showMore };
}
