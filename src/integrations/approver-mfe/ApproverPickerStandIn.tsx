import { useState } from "react";
import { IpsButton, IpsRadioListMobile, IpsSearchFieldMobile, type IpsRadioListMobileValue } from "ui-library";
import { isEmptyList, useAsyncResource, type AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { ApproverRef } from "@/types/common.schema";
import type { ApproverPickerProps } from "./approverPickerContract";
import { searchApprovers } from "./approversStandInService";
import { APPROVER_STAND_IN_TEXTS } from "./approverStandInTexts";

const TEXTS = APPROVER_STAND_IN_TEXTS;

function approverLabel(approver: ApproverRef): string {
  return approver.roleTitle ? `${approver.fullName}${TEXTS.roleSeparator}${approver.roleTitle}` : approver.fullName;
}

/**
 * תחליף זמני ל-MFE החיצוני של הגורם המאשר, באותו חוזה (onSelect):
 * תיבת חיפוש ברוחב מלא, ומתחתיה רשימת תוצאות פתוחה שמתעדכנת בזמן ההקלדה.
 */
export default function ApproverPickerStandIn({ onSelect }: ApproverPickerProps) {
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();

  // התוצאות מופיעות רק אחרי שמקלידים
  const results = useAsyncResource({
    requestKey: trimmedQuery === "" ? null : trimmedQuery,
    load: searchApprovers,
    isEmpty: isEmptyList,
  });

  const handleSelect = (approverId: IpsRadioListMobileValue) => {
    const selectedApprover = results.data?.find((approver) => approver.id === approverId);
    if (selectedApprover) {
      onSelect(selectedApprover);
    }
  };

  return (
    // שדה החיפוש לבן ובלי מסגרת, ולכן הוא יושב על משטח בצבע הרקע כדי שייראה על הטופס הלבן
    <div className="rounded-card bg-background p-2">
      <IpsSearchFieldMobile
        aria-label={TEXTS.searchLabel}
        placeholder={TEXTS.searchPlaceholder}
        clearButtonLabel={TEXTS.clearSearch}
        value={query}
        onChange={setQuery}
      />
      <SearchResults results={results} onSelect={handleSelect} />
    </div>
  );
}

interface SearchResultsProps {
  results: AsyncResource<ApproverRef[]>;
  onSelect: (approverId: IpsRadioListMobileValue) => void;
}

function SearchResults({ results, onSelect }: SearchResultsProps) {
  switch (results.status) {
    case "idle":
      return null;
    case "loading":
      return <ResultsMessage text={TEXTS.searching} />;
    case "error":
      return (
        <div role="alert" className="flex items-center justify-between gap-2 px-2 pt-2">
          <span className="text-sm text-text-muted">{TEXTS.searchFailed}</span>
          <IpsButton variant="text" size="small" onClick={results.reload}>
            {TEXTS.retry}
          </IpsButton>
        </div>
      );
    case "empty":
      return <ResultsMessage text={TEXTS.noResults} />;
    case "success":
      return (
        <div className="mt-2 rounded-base bg-paper px-3">
          <IpsRadioListMobile
            aria-label={TEXTS.resultsLabel}
            options={(results.data ?? []).map((approver) => ({ value: approver.id, label: approverLabel(approver) }))}
            value={null}
            onChange={onSelect}
          />
        </div>
      );
  }
}

function ResultsMessage({ text }: { text: string }) {
  return (
    <p role="status" className="px-2 pt-2 text-sm text-text-muted">
      {text}
    </p>
  );
}
