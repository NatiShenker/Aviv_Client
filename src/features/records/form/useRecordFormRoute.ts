import { useMatch, useSearchParams } from "react-router-dom";
import { BASED_ON_QUERY_PARAM, type TraineeRouteParams } from "@/routes";
import type { RecordFormTarget } from "./formStartingPoint";

interface RecordFormRouteOptions<TRecordRef> {
  createPattern: string;
  editPattern: string;
  /** שם הפרמטר בנתיב העריכה שמזהה את הרשומה */
  recordParam: keyof Pick<TraineeRouteParams, "recordId" | "recordKey">;
  /** מזהה הרשומה מתוך הטקסט (בנתיב העריכה, או ב-?basedOn= של היצירה), או null כשהוא לא תקין */
  parseRecordRef: (value: string | undefined) => TRecordRef | null;
}

/** במובייל: הטופס שהכתובת מבקשת לפתוח מעל ההיסטוריה. null = הכתובת היא של ההיסטוריה עצמה, ומגירת הטופס סגורה */
export function useRecordFormRoute<TRecordRef>({
  createPattern,
  editPattern,
  recordParam,
  parseRecordRef,
}: RecordFormRouteOptions<TRecordRef>): RecordFormTarget<TRecordRef> | null {
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
