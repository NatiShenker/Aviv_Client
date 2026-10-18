import { useMatch, useSearchParams } from "react-router-dom";
import { BASED_ON_QUERY_PARAM, type TraineeRouteParams } from "@/routes";

/**
 * הטופס שהכתובת מבקשת לפתוח מעל ההיסטוריה: יצירה (אולי על בסיס רשומה שהסתיימה), או עריכה של רשומה
 */
export type FormSheetTarget<TRecordRef> =
  | { mode: "create"; basedOnRef: TRecordRef | null }
  | { mode: "edit"; recordRef: TRecordRef };

interface FormSheetRouteOptions<TRecordRef> {
  createPattern: string;
  editPattern: string;
  /** שם הפרמטר בנתיב העריכה שמזהה את הרשומה */
  recordParam: keyof Pick<TraineeRouteParams, "recordId" | "recordKey">;
  /** מזהה הרשומה מתוך הטקסט (בנתיב העריכה, או ב-?basedOn= של היצירה), או null כשהוא לא תקין */
  parseRecordRef: (value: string | undefined) => TRecordRef | null;
}

/** null = הכתובת היא של ההיסטוריה עצמה, ומגירת הטופס סגורה */
export function useFormSheetRoute<TRecordRef>({
  createPattern,
  editPattern,
  recordParam,
  parseRecordRef,
}: FormSheetRouteOptions<TRecordRef>): FormSheetTarget<TRecordRef> | null {
  const createMatch = useMatch(createPattern);
  const editMatch = useMatch(editPattern);
  const [searchParams] = useSearchParams();

  if (createMatch) {
    const basedOnValue = searchParams.get(BASED_ON_QUERY_PARAM) ?? undefined;
    return { mode: "create", basedOnRef: parseRecordRef(basedOnValue) };
  }

  const recordRef = editMatch ? parseRecordRef(editMatch.params[recordParam]) : null;
  if (recordRef !== null) {
    return { mode: "edit", recordRef };
  }
  return null;
}
