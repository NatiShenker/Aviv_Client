import type { FormSheetTarget } from "./useFormSheetRoute";

/**
 * מאיפה טופס מתחיל: רשומה חדשה ריקה, עריכה של רשומה, או רשומה חדשה על בסיס רשומה שהסתיימה
 * (רשומה שהסתיימה לא נערכת - ספק 00 §3.22)
 */
export type FormStartingPoint<TRecord> =
  | { kind: "new" }
  | { kind: "edit"; record: TRecord }
  | { kind: "basedOn"; record: TRecord };

export function resolveFormStartingPoint<TRecord>(
  target: FormSheetTarget<unknown> | null,
  editRecord: TRecord | null,
  basedOnRecord: TRecord | null,
): FormStartingPoint<TRecord> {
  if (target?.mode === "edit" && editRecord) {
    return { kind: "edit", record: editRecord };
  }
  if (target?.mode === "create" && basedOnRecord) {
    return { kind: "basedOn", record: basedOnRecord };
  }
  return { kind: "new" };
}

/** הרשומה שהטופס מעדכן, או null כשהטופס יוצר רשומה חדשה */
export function editedRecordOf<TRecord>(startingPoint: FormStartingPoint<TRecord>): TRecord | null {
  return startingPoint.kind === "edit" ? startingPoint.record : null;
}

/** הרשומה שהערכים נלקחו ממנה (בעריכה או "על בסיס"), או null בטופס ריק */
export function sourceRecordOf<TRecord>(startingPoint: FormStartingPoint<TRecord>): TRecord | null {
  return startingPoint.kind === "new" ? null : startingPoint.record;
}
