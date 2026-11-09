import ExpandableRecordCard from "@/features/records/history/card/ExpandableRecordCard";
import RecordPeriodSummary from "@/features/records/history/card/RecordPeriodSummary";
import { isRecordActive } from "@/features/records/history/recordStatus";
import type { TraineePhoneRecordDto } from "@/types/phone-exceptions.schema";
import {
  buildNumberRecordDetails,
  numberRecordCardDomId,
  numberRecordKeyOf,
  recordTypeOf,
  type TraineePhoneRecordType,
} from "../numberRestrictionsLogic";
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
  const recordType = recordTypeOf(record);

  return (
    <ExpandableRecordCard
      id={numberRecordCardDomId(numberRecordKeyOf(record))}
      icon="numberRestriction"
      iconTone="danger"
      summaryTitle={
        <>
          <span dir="ltr" className="whitespace-nowrap">
            {record.textPhoneNumber}
          </span>
          <RecordTypeTag type={recordType} />
        </>
      }
      summaryMeta={
        <RecordPeriodSummary
          record={record}
          activeLabel={CARD_TEXTS.activeBadge[recordType]}
          endedLabel={CARD_TEXTS.endedBadge[recordType]}
        />
      }
      details={buildNumberRecordDetails(record)}
      isOpen={isOpen}
      onToggle={onToggle}
      isEnded={!isRecordActive(record)}
      onEdit={onEdit}
      createBasedOnLabel={CARD_TEXTS.createBasedOn[recordType]}
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
