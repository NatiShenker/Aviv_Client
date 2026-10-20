import { useEffect, useRef, useState } from "react";
import AppIcon from "@/shared/components/AppIcon";
import ErrorText from "@/shared/components/form/ErrorText";
import FieldIntro from "@/shared/components/form/FieldIntro";
import type { FieldOptionValue } from "@/shared/components/form/formControls";
import { useFormControls } from "@/shared/components/form/FormControlsProvider";
import type { CallLimitKind } from "@/types/common.schema";
import { FORM_TEXTS } from "../formTexts";
import type { CallRuleKind } from "./callConditionsLogic";

const DURATION_TEXTS = FORM_TEXTS.duration;
const NON_DIGIT_CHARACTERS = /\D/g;
// ספק 00 §3.7: עד 3 ספרות
const DURATION_MAX_LENGTH = 3;

const LIMIT_KINDS: CallLimitKind[] = ["full", "limited"];

function isLimitKind(value: FieldOptionValue): value is CallLimitKind {
  return LIMIT_KINDS.includes(value as CallLimitKind);
}

interface LimitTypeSelectorProps {
  /** "restriction" בהגבלות, "permit" בהיתרים - משנה רק את הטקסטים (ספק 00 §3.9) */
  context: CallRuleKind;
  kind: CallLimitKind;
  onKindChange: (kind: CallLimitKind) => void;
  durationText: string;
  /** מקבל רק ספרות */
  onDurationTextChange: (durationText: string) => void;
  durationError?: string;
  /** מזהה שדה המשך, כדי שאפשר יהיה להעביר אליו פוקוס כשיש בו שגיאה */
  durationInputId: string;
}

/**
 * בחירת סוג ההגבלה / ההיתר: מלא, או עם משך מרבי לכל שיחה (ספק 00 §3.9).
 * כל אפשרות מציגה את ההשלכה שלה, כדי שאפשר יהיה להשוות לפני הבחירה.
 * שדה המשך מופיע רק בסוג השני. הערך שהוקלד נשמר גם כשחוזרים לסוג המלא, אבל לא נשלח (ההחלטה בטופס).
 */
export default function LimitTypeSelector({
  context,
  kind,
  onKindChange,
  durationText,
  onDurationTextChange,
  durationError,
  durationInputId,
}: LimitTypeSelectorProps) {
  const { RadioGroupField, TextField } = useFormControls();
  const texts = FORM_TEXTS.limitType[context];
  const durationInputRef = useRef<HTMLInputElement>(null);
  // הפוקוס עובר לשדה המשך רק כשהמשתמש החליף סוג - לא כשרשומה קיימת נפתחת לעריכה
  const [shouldFocusDuration, setShouldFocusDuration] = useState(false);

  useEffect(() => {
    if (shouldFocusDuration && kind === "limited") {
      durationInputRef.current?.focus();
      setShouldFocusDuration(false);
    }
  }, [shouldFocusDuration, kind]);

  const handleKindChange = (value: FieldOptionValue) => {
    if (!isLimitKind(value)) return;
    onKindChange(value);
    setShouldFocusDuration(value === "limited");
  };

  const options = LIMIT_KINDS.map((limitKind) => ({
    value: limitKind,
    label: texts[limitKind].label,
    description: texts[limitKind].hint,
  }));

  return (
    <div>
      <FieldIntro title={texts.title} />
      <div className="mt-2">
        <RadioGroupField aria-label={texts.title} options={options} value={kind} onChange={handleKindChange} />
      </div>

      {kind === "limited" && (
        <div className="mt-3 grid grid-cols-2 gap-2 motion-safe:animate-fade-in">
          <TextField
            ref={durationInputRef}
            id={durationInputId}
            label={DURATION_TEXTS.label}
            required
            inputMode="numeric"
            autoComplete="off"
            maxLength={DURATION_MAX_LENGTH}
            placeholder={DURATION_TEXTS.placeholder}
            suffix={DURATION_TEXTS.unit}
            endIcon={<AppIcon name="timer" />}
            clearButtonLabel={DURATION_TEXTS.clear}
            value={durationText}
            onChange={(text) => onDurationTextChange(text.replace(NON_DIGIT_CHARACTERS, ""))}
            error={Boolean(durationError)}
          />
        </div>
      )}
      <ErrorText message={durationError} />
    </div>
  );
}
