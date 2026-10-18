import { useId } from "react";
import ErrorText from "../ErrorText";
import { FORM_TEXTS } from "../formTexts";
import PhoneInputRow from "./PhoneInputRow";

interface PhoneSearchFieldProps {
  id: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  canSearch: boolean;
  isSearching: boolean;
  onSearch: () => void;
}

/** מספר אחד וכפתור "חיפוש" (ספק 00 §3.15) */
export default function PhoneSearchField({
  id,
  hint,
  value,
  onChange,
  error,
  canSearch,
  isSearching,
  onSearch,
}: PhoneSearchFieldProps) {
  const hintId = useId();

  return (
    <div>
      <p id={hintId} className="text-xs text-text-muted">
        {hint}
      </p>
      <PhoneInputRow
        id={id}
        hintId={hintId}
        value={value}
        onChange={onChange}
        hasError={Boolean(error)}
        actionLabel={FORM_TEXTS.phone.search}
        actionIcon="search"
        isActionEnabled={canSearch}
        isActionBusy={isSearching}
        enterKeyHint="search"
        onAction={onSearch}
      />
      <ErrorText message={error} />
    </div>
  );
}
