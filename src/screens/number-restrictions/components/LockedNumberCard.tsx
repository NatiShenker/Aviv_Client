import type { TraineePhoneRecordDto } from "@/schemas/phone-exceptions.schema";
import AppIcon from "@/shared/icons/AppIcon";
import { NUMBER_RESTRICTIONS_TEXTS } from "../numberRestrictionsTexts";
import RestrictionSummaryLines from "./RestrictionSummaryLines";

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
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-error-soft text-error">
            <AppIcon name="numberRestriction" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-base text-text-primary">
              <span dir="ltr">{record.phoneNumber}</span>
            </p>
            <p className="text-sm text-text-muted">{TEXTS.recordTypes[record.type]}</p>
          </div>
        </div>

        {record.type === "permit" && (
          <div className="mt-3 border-t border-divider pt-3">
            <p className="text-sm text-text-muted">{TEXTS.form.lockedCard.onRestriction}</p>
            <div className="mt-0.5">
              <RestrictionSummaryLines restriction={record.sourceRestriction} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
