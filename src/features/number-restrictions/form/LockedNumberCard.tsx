import RecordIconCircle from "@/features/records/history/card/RecordIconCircle";
import type { TraineePhoneRecordDto } from "@/types/phone-exceptions.schema";
import { recordTypeOf } from "../numberRestrictionsLogic";
import { NUMBER_RESTRICTIONS_TEXTS } from "../numberRestrictionsTexts";
import SourceRestrictionSummaryLines from "./source-restriction/SourceRestrictionSummaryLines";

const TEXTS = NUMBER_RESTRICTIONS_TEXTS;

interface LockedNumberCardProps {
  record: TraineePhoneRecordDto;
}

/** בעריכה, במקום בלוק 0: המספר והסוג נעולים, ובהיתר - גם ההגבלה שעליה הוא יושב (ספק 04 form §3.3) */
export default function LockedNumberCard({ record }: LockedNumberCardProps) {
  return (
    <div className="py-6">
      <div className="rounded-card border border-divider bg-paper p-4">
        <div className="flex items-center gap-3">
          <RecordIconCircle icon="numberRestriction" tone="danger" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-base text-text-primary">
              <span dir="ltr">{record.textPhoneNumber}</span>
            </p>
            <p className="text-sm text-text-muted">{TEXTS.recordTypes[recordTypeOf(record)]}</p>
          </div>
        </div>

        {record.isPermit && (
          <div className="mt-3 border-t border-divider pt-3">
            <p className="text-sm text-text-muted">{TEXTS.form.lockedCard.onRestriction}</p>
            <div className="mt-0.5">
              <SourceRestrictionSummaryLines restriction={record.sourceRestriction} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
