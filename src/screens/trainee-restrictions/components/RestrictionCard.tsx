import type { TraineeRestrictionRecordDto } from "@/schemas/trainee-restrictions.schema";
import ExpandableRecordCard from "@/shared/components/history/ExpandableRecordCard";
import { isRecordActive } from "@/shared/components/history/historySort";
import RecordStatusBadge from "@/shared/components/history/RecordStatusBadge";
import {
  buildRestrictionDateRange,
  buildRestrictionDetails,
  buildRestrictionReasonSummary,
  restrictionCardDomId,
} from "../traineeRestrictionsLogic";
import { TRAINEE_RESTRICTIONS_TEXTS } from "../traineeRestrictionsTexts";

interface RestrictionCardProps {
  record: TraineeRestrictionRecordDto;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
}

/** כרטיס הגבלה בהיסטוריה (ספק 03 history §3.1-3.2) */
export default function RestrictionCard({ record, isOpen, onToggle, onEdit }: RestrictionCardProps) {
  return (
    <ExpandableRecordCard
      id={restrictionCardDomId(record.id)}
      icon="traineeRestriction"
      iconTone="danger"
      summaryTop={
        <>
          <span dir="ltr" className="whitespace-nowrap text-base text-text-muted">
            {buildRestrictionDateRange(record)}
          </span>
          <RecordStatusBadge
            isActive={isRecordActive(record)}
            activeLabel={TRAINEE_RESTRICTIONS_TEXTS.card.activeBadge}
          />
        </>
      }
      summaryText={buildRestrictionReasonSummary(record)}
      details={buildRestrictionDetails(record)}
      isOpen={isOpen}
      onToggle={onToggle}
      onEdit={onEdit}
    />
  );
}
