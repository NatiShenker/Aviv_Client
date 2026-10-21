import { useId } from "react";
import { IpsIconButton } from "ui-library";
import AppIcon from "@/shared/components/AppIcon";
import ErrorText from "@/shared/components/form/ErrorText";
import { EXPANDED_TOUCH_TARGET_SX } from "@/shared/components/touchTarget";
import type { PhoneString } from "@/types/common.schema";
import { FORM_TEXTS } from "../formTexts";
import PhoneInputRow from "./PhoneInputRow";

const TEXTS = FORM_TEXTS.phone;

interface PhoneNumbersFieldProps {
  id: string;
  hint: string;
  /** המספר שבשדה, לפני שנוסף */
  value: string;
  onChange: (value: string) => void;
  error?: string;
  phones: PhoneString[];
  onAdd: () => void;
  onRemove: (phone: PhoneString) => void;
}

/** כמה מספרים: שדה עם "הוספה", ומתחתיו המספרים שנוספו כצ'יפים עם X להסרה (ספק 00 §3.15) */
export default function PhoneNumbersField({
  id,
  hint,
  value,
  onChange,
  error,
  phones,
  onAdd,
  onRemove,
}: PhoneNumbersFieldProps) {
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
        actionLabel={TEXTS.add}
        actionIcon="add"
        isActionEnabled={value.trim() !== ""}
        enterKeyHint="done"
        onAction={onAdd}
      />
      <ErrorText message={error} />

      {phones.length > 0 && (
        <ul aria-label={TEXTS.addedNumbers} className="mt-2 flex flex-wrap gap-2">
          {phones.map((phone) => (
            <li
              key={phone}
              className="flex h-8 items-center gap-0.5 rounded-chip bg-primary-soft ps-3 text-sm text-text-primary"
            >
              <span dir="ltr">{phone}</span>
              <IpsIconButton
                size="small"
                sx={EXPANDED_TOUCH_TARGET_SX}
                icon={<AppIcon name="close" size="small" />}
                aria-label={TEXTS.removeNumber(phone)}
                onClick={() => onRemove(phone)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
