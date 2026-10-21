import { formatDateRange } from "@/utils/dates";
import { isRecordActive, type DatedHistoryRecord } from "../recordStatus";
import RecordStatusBadge from "./RecordStatusBadge";

interface RecordPeriodSummaryProps {
  record: DatedHistoryRecord;
  /** "פעילה" (הגבלה, הודעה) או "פעיל" (היתר) */
  activeLabel: string;
  /** "הסתיימה" (הגבלה, הודעה) או "הסתיים" (היתר) */
  endedLabel: string;
}

/** שורת המשנה בכרטיס סגור: מתי - טווח התאריכים ותגית הסטטוס, שנגזרת מהם (ספק 00 §3.22) */
export default function RecordPeriodSummary({ record, activeLabel, endedLabel }: RecordPeriodSummaryProps) {
  return (
    <>
      <span dir="ltr" className="whitespace-nowrap">
        {formatDateRange(record.startDate, record.endDate)}
      </span>
      <RecordStatusBadge isActive={isRecordActive(record)} activeLabel={activeLabel} endedLabel={endedLabel} />
    </>
  );
}
