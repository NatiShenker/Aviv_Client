import type { SourceRestrictionSummaryDto } from "@/types/phone-exceptions.schema";
import { formatDateRange } from "@/utils/dates";
import { buildRestrictionReasonText, buildScopeLabel } from "../../numberRestrictionsLogic";
import { NUMBER_RESTRICTIONS_TEXTS } from "../../numberRestrictionsTexts";

interface SourceRestrictionSummaryLinesProps {
  restriction: SourceRestrictionSummaryDto;
}

/** שורות ההגבלה: היקף, ומתחתיו טווח התאריכים והפירוט שלה (ספק 04 form §3.2.1 שורות 1–2) */
export default function SourceRestrictionSummaryLines({ restriction }: SourceRestrictionSummaryLinesProps) {
  return (
    <>
      <p className="text-base font-medium text-text-primary">{buildScopeLabel(restriction)}</p>
      <p className="mt-1 text-sm text-text-muted">
        <span dir="ltr">{formatDateRange(restriction.dateStart, restriction.dateEnd)}</span>
        {NUMBER_RESTRICTIONS_TEXTS.values.partsSeparator}
        {buildRestrictionReasonText(restriction)}
      </p>
    </>
  );
}
