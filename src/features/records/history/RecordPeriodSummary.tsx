import { formatDateRange } from "@/shared/formatting/dateFormat";
import { isRecordActive, type DatedHistoryRecord } from "./historySort";
import RecordStatusBadge from "./RecordStatusBadge";

interface RecordPeriodSummaryProps {
  record: DatedHistoryRecord;
  /** "פעילה" (הגבלה, הודעה) או "פעיל" (היתר) */
  activeLabel: string;
}

/** שורת המשנה בכרטיס סגור: מתי - טווח התאריכים ותגית הסטטוס, שנגזרת מהם (ספק 00 §3.22) */
export default function RecordPeriodSummary({ record, activeLabel }: RecordPeriodSummaryProps) {
  return (
    <>
      <span dir="ltr" className="whitespace-nowrap">
        {formatDateRange(record.startDate, record.endDate)}
      </span>
      <RecordStatusBadge isActive={isRecordActive(record)} activeLabel={activeLabel} />
    </>
  );
}
