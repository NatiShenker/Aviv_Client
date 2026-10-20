import ExpandableRecordCard from "@/features/records/history/card/ExpandableRecordCard";
import RecordPeriodSummary from "@/features/records/history/card/RecordPeriodSummary";
import { isRecordActive } from "@/features/records/history/recordStatus";
import type { TraineeRestrictionRecordDto } from "@/types/trainee-restrictions.schema";
import { TRAINEE_RESTRICTIONS_TEXTS } from "../traineeRestrictionsTexts";
import { buildTraineeRestrictionDetails, buildTraineeRestrictionTypeLabel, traineeRestrictionCardDomId } from "./traineeRestrictionsLogic";

const CARD_TEXTS = TRAINEE_RESTRICTIONS_TEXTS.card;

interface TraineeRestrictionCardProps {
  record: TraineeRestrictionRecordDto;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onCreateBasedOn: () => void;
}

/** כרטיס הגבלה בהיסטוריה: סוג ההגבלה, ומתחתיו התאריכים והסטטוס (ספק 03 history §3.1-3.2) */
export default function TraineeRestrictionCard({ record, isOpen, onToggle, onEdit, onCreateBasedOn }: TraineeRestrictionCardProps) {
  return (
    <ExpandableRecordCard
      id={traineeRestrictionCardDomId(record.id)}
      icon="traineeRestriction"
      iconTone="danger"
      summaryTitle={<span className="truncate">{buildTraineeRestrictionTypeLabel(record)}</span>}
      summaryMeta={<RecordPeriodSummary record={record} activeLabel={CARD_TEXTS.activeBadge} />}
      details={buildTraineeRestrictionDetails(record)}
      isOpen={isOpen}
      onToggle={onToggle}
      isEnded={!isRecordActive(record)}
      onEdit={onEdit}
      createBasedOnLabel={CARD_TEXTS.createBasedOn}
      onCreateBasedOn={onCreateBasedOn}
    />
  );
}
