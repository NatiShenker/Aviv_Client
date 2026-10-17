/*
 * זכרון של התשובה האחרונה לכל צירוף פרמטרים של שאילתה, עד רענון הדף.
 * מאפשר להציג מיד נתונים שכבר נטענו, למשל בחזרה לרשימה ממסך אחר.
 * פעולה שמשנה נתונים חייבת לעדכן או לנקות את הזכרון של השאילתות שהיא משפיעה עליהן.
 */

export interface QueryCache<TParams, TData> {
  get: (params: TParams) => TData | null;
  set: (params: TParams, data: TData) => void;
  clear: () => void;
}

export function createQueryCache<TParams, TData>(toKey: (params: TParams) => string): QueryCache<TParams, TData> {
  const entries = new Map<string, TData>();

  return {
    get: (params) => entries.get(toKey(params)) ?? null,
    set: (params, data) => {
      entries.set(toKey(params), data);
    },
    clear: () => entries.clear(),
  };
}

/** מפתח קבוע לרשימת מזהים, בלי תלות בסדר */
export function idsKey(ids: number[]): string {
  return [...ids].sort((first, second) => first - second).join(",");
}
