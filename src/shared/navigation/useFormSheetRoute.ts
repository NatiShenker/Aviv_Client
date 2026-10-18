import { useMatch, type Params } from "react-router-dom";

/** הטופס שהכתובת מבקשת לפתוח מעל ההיסטוריה: יצירה, או עריכה של רשומה מסוימת */
export type FormSheetTarget<TRecordRef> = { mode: "create" } | { mode: "edit"; recordRef: TRecordRef };

interface FormSheetRouteOptions<TRecordRef> {
  createPattern: string;
  editPattern: string;
  /** מזהה הרשומה מתוך פרמטרי נתיב העריכה, או null כשהוא לא תקין */
  parseRecordRef: (params: Params) => TRecordRef | null;
}

/** null = הכתובת היא של ההיסטוריה עצמה, ומגירת הטופס סגורה */
export function useFormSheetRoute<TRecordRef>({
  createPattern,
  editPattern,
  parseRecordRef,
}: FormSheetRouteOptions<TRecordRef>): FormSheetTarget<TRecordRef> | null {
  const createMatch = useMatch(createPattern);
  const editMatch = useMatch(editPattern);

  if (createMatch) {
    return { mode: "create" };
  }

  const recordRef = editMatch ? parseRecordRef(editMatch.params) : null;
  if (recordRef !== null) {
    return { mode: "edit", recordRef };
  }
  return null;
}
