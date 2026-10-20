import type { TraineeListFiltersState } from "@/types/trainees.schema";

/*
 * מצב הרשימה בזכרון של האפליקציה, כדי שבחזרה ממסך אחר המשתמש ימצא אותה כפי שעזב:
 * חיפוש, סינון, מיון, כמה כרטיסים הוצגו ואיפה הייתה הגלילה. רענון הדף מאפס (סינון האגף נשמר בנפרד ל-30 יום).
 */

export interface RememberedTraineesList {
  instituteId: number;
  filters: TraineeListFiltersState;
  sortKey: string;
  /** null = עוד לא נטען יותר מהעמוד הראשון */
  visibleCount: number | null;
  scrollY: number;
}

interface ListPosition {
  visibleCount?: number;
  scrollY?: number;
}

// מקום אחד בלבד: אחרי החלפת פנימייה, המצב של הפנימייה הקודמת כבר לא רלוונטי
let remembered: RememberedTraineesList | null = null;

export function readRememberedTraineesList(instituteId: number): RememberedTraineesList | null {
  return remembered?.instituteId === instituteId ? remembered : null;
}

export function rememberTraineesListView(
  instituteId: number,
  filters: TraineeListFiltersState,
  sortKey: string,
): void {
  const previous = readRememberedTraineesList(instituteId);
  remembered = {
    instituteId,
    filters,
    sortKey,
    visibleCount: previous?.visibleCount ?? null,
    scrollY: previous?.scrollY ?? 0,
  };
}

export function rememberTraineesListPosition(position: ListPosition): void {
  if (remembered) {
    remembered = { ...remembered, ...position };
  }
}

/**
 * הדסקטופ לא משחזר מיקום ברשימה. הוא מוחק את המיקום השמור,
 * כדי שמעבר חזרה לפריסת המובייל לא ישחזר גלילה ישנה שכבר לא מתאימה
 */
export function forgetTraineesListPosition(): void {
  if (remembered) {
    remembered = { ...remembered, visibleCount: null, scrollY: 0 };
  }
}
