import type { TraineePhoneRecordDto, TraineePhoneRecordType } from "@/schemas/phone-exceptions.schema";
import ExpandableRecordCard from "@/shared/components/history/ExpandableRecordCard";
import { isRecordActive } from "@/shared/components/history/historySort";
import RecordStatusBadge from "@/shared/components/history/RecordStatusBadge";
import {
  buildNumberRecordDetails,
  buildNumberRecordKey,
  buildNumberRecordReasonSummary,
  numberRecordCardDomId,
} from "../numberRestrictionsLogic";
import { NUMBER_RESTRICTIONS_TEXTS } from "../numberRestrictionsTexts";

const CARD_TEXTS = NUMBER_RESTRICTIONS_TEXTS.card;

interface NumberRecordCardProps {
  record: TraineePhoneRecordDto;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
}

/** כרטיס הגבלה או היתר בהיסטוריה. אותו אייקון לשניהם - מנעול פתוח אדום (ספק 04 history §3.1-3.2) */
export default function NumberRecordCard({ record, isOpen, onToggle, onEdit }: NumberRecordCardProps) {
  return (
    <ExpandableRecordCard
      id={numberRecordCardDomId(buildNumberRecordKey(record))}
      icon="numberRestriction"
      iconTone="danger"
      summaryTop={
        <>
          <span dir="ltr" className="whitespace-nowrap text-base text-text-muted">
            {record.phoneNumber}
          </span>
          <RecordTypeTag type={record.type} />
          <RecordStatusBadge isActive={isRecordActive(record)} activeLabel={CARD_TEXTS.activeBadge[record.type]} />
        </>
      }
      summaryText={buildNumberRecordReasonSummary(record)}
      details={buildNumberRecordDetails(record)}
      isOpen={isOpen}
      onToggle={onToggle}
      onEdit={onEdit}
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
