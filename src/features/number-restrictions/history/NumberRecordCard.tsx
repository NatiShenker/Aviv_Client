import ExpandableRecordCard from "@/features/records/history/ExpandableRecordCard";
import { isRecordActive } from "@/features/records/history/historySort";
import RecordPeriodSummary from "@/features/records/history/RecordPeriodSummary";
import type { TraineePhoneRecordDto, TraineePhoneRecordType } from "@/schemas/phone-exceptions.schema";
import { buildNumberRecordDetails, buildNumberRecordKey, numberRecordCardDomId } from "../numberRestrictionsLogic";
import { NUMBER_RESTRICTIONS_TEXTS } from "../numberRestrictionsTexts";

const CARD_TEXTS = NUMBER_RESTRICTIONS_TEXTS.card;

interface NumberRecordCardProps {
  record: TraineePhoneRecordDto;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onCreateBasedOn: () => void;
}

/**
 * כרטיס הגבלה או היתר בהיסטוריה: המספר ותגית הסוג, ומתחתם התאריכים והסטטוס.
 * אותו אייקון לשניהם - מנעול פתוח אדום (ספק 04 history §3.1-3.2)
 */
export default function NumberRecordCard({ record, isOpen, onToggle, onEdit, onCreateBasedOn }: NumberRecordCardProps) {
  return (
    <ExpandableRecordCard
      id={numberRecordCardDomId(buildNumberRecordKey(record))}
      icon="numberRestriction"
      iconTone="danger"
      summaryTitle={
        <>
          <span dir="ltr" className="whitespace-nowrap">
            {record.phoneNumber}
          </span>
          <RecordTypeTag type={record.type} />
        </>
      }
      summaryMeta={<RecordPeriodSummary record={record} activeLabel={CARD_TEXTS.activeBadge[record.type]} />}
      details={buildNumberRecordDetails(record)}
      isOpen={isOpen}
      onToggle={onToggle}
      isEnded={!isRecordActive(record)}
      onEdit={onEdit}
      createBasedOnLabel={CARD_TEXTS.createBasedOn[record.type]}
      onCreateBasedOn={onCreateBasedOn}
    />
  );
}

// תגית הסוג: "היתר" / "הגבלה" (ספק 00 §3.19)
function RecordTypeTag({ type }: { type: TraineePhoneRecordType }) {
  return (
    <span className="flex h-5 shrink-0 items-center rounded-full bg-primary-soft px-2 text-xs text-text-primary">
      {CARD_TEXTS.typeTag[type]}
    </span>
  );
}
