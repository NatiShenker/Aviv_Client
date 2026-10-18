import type { TraineeRestrictionRecordDto } from "@/schemas/trainee-restrictions.schema";
import ExpandableRecordCard from "@/shared/components/history/ExpandableRecordCard";
import { isRecordActive } from "@/shared/components/history/historySort";
import RecordPeriodSummary from "@/shared/components/history/RecordPeriodSummary";
import { buildRestrictionDetails, buildRestrictionTypeLabel, restrictionCardDomId } from "../traineeRestrictionsLogic";
import { TRAINEE_RESTRICTIONS_TEXTS } from "../traineeRestrictionsTexts";

const CARD_TEXTS = TRAINEE_RESTRICTIONS_TEXTS.card;

interface RestrictionCardProps {
  record: TraineeRestrictionRecordDto;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onCreateBasedOn: () => void;
}

/** כרטיס הגבלה בהיסטוריה: סוג ההגבלה, ומתחתיו התאריכים והסטטוס (ספק 03 history §3.1-3.2) */
export default function RestrictionCard({ record, isOpen, onToggle, onEdit, onCreateBasedOn }: RestrictionCardProps) {
  return (
    <ExpandableRecordCard
      id={restrictionCardDomId(record.id)}
      icon="traineeRestriction"
      iconTone="danger"
      summaryTitle={<span className="truncate">{buildRestrictionTypeLabel(record)}</span>}
      summaryMeta={<RecordPeriodSummary record={record} activeLabel={CARD_TEXTS.activeBadge} />}
      details={buildRestrictionDetails(record)}
      isOpen={isOpen}
      onToggle={onToggle}
      isEnded={!isRecordActive(record)}
      onEdit={onEdit}
      createBasedOnLabel={CARD_TEXTS.createBasedOn}
      onCreateBasedOn={onCreateBasedOn}
    />
  );
}
