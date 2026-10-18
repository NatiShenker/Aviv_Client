import type { SourceRestrictionSummaryDto } from "@/schemas/phone-exceptions.schema";
import { formatDateRange } from "@/shared/formatting/dateFormat";
import { buildRestrictionReasonText, buildScopeLabel } from "../numberRestrictionsLogic";
import { NUMBER_RESTRICTIONS_TEXTS } from "../numberRestrictionsTexts";

interface RestrictionSummaryLinesProps {
  restriction: SourceRestrictionSummaryDto;
}

/** שורות ההגבלה: היקף, ומתחתיו טווח התאריכים והסיבה (ספק 04 form §3.2.1 שורות 1–2) */
export default function RestrictionSummaryLines({ restriction }: RestrictionSummaryLinesProps) {
  return (
    <>
      <p className="text-base font-medium text-text-primary">{buildScopeLabel(restriction)}</p>
      <p className="mt-1 text-sm text-text-muted">
        <span dir="ltr">{formatDateRange(restriction.startDate, restriction.endDate)}</span>
        {NUMBER_RESTRICTIONS_TEXTS.values.partsSeparator}
        {buildRestrictionReasonText(restriction)}
      </p>
    </>
  );
}
