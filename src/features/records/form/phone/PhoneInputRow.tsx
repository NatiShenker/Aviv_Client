import type { KeyboardEvent } from "react";
import { IpsButton } from "ui-library";
import AppIcon from "@/shared/components/AppIcon";
import type { AppIconName } from "@/shared/components/appIcons";
import { useFormControls } from "@/shared/components/form/FormControlsProvider";
import { usePlatform } from "@/store/platformContext";
import { ENTER_KEY } from "@/utils/dom";
import { FORM_TEXTS } from "../formTexts";

const TEXTS = FORM_TEXTS.phone;

// הכפתור ממלא את גובה השורה (גובה השדה), בלי הריווח האנכי שלו - הטקסט נשאר ממורכז
const FIELD_HEIGHT_BUTTON_SX = { height: "100%", paddingTop: 0, paddingBottom: 0 } as const;

interface PhoneInputRowProps {
  id: string;
  /** ההסבר שמעל השדה, שמתאר אותו לקורא מסך */
  hintId: string;
  value: string;
  onChange: (value: string) => void;
  hasError: boolean;
  actionLabel: string;
  actionIcon: AppIconName;
  isActionEnabled: boolean;
  /** בזמן שהפעולה רצה (למשל חיפוש) הכפתור בטעינה ולא לחיץ */
  isActionBusy?: boolean;
  /** התווית של מקש האישור במקלדת */
  enterKeyHint: "done" | "search";
  onAction: () => void;
}

/** שדה טלפון וכפתור פעולה לצידו - "הוספה" או "חיפוש" (ספק 00 §3.15) */
export default function PhoneInputRow({
  id,
  hintId,
  value,
  onChange,
  hasError,
  actionLabel,
  actionIcon,
  isActionEnabled,
  isActionBusy = false,
  enterKeyHint,
  onAction,
}: PhoneInputRowProps) {
  const { TextField } = useFormControls();
  // בדסקטופ השדה (39) נמוך מהכפתור (44), ולכן הכפתור מתיישר לגובה השדה. במובייל השורה נשארת כמו שהייתה (הוחלט 2026-10-21)
  const isDesktop = usePlatform().layout === "desktop";
  const canRunAction = isActionEnabled && !isActionBusy;

  // Enter מפעיל את הפעולה של השדה, ולא שולח את הטופס
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== ENTER_KEY) return;
    event.preventDefault();
    if (canRunAction) {
      onAction();
    }
  };

  return (
    <div className={`mt-1 flex gap-2 ${isDesktop ? "items-stretch" : "items-center"}`}>
      <div className="min-w-0 flex-1">
        <TextField
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          enterKeyHint={enterKeyHint}
          aria-label={TEXTS.inputLabel}
          aria-describedby={hintId}
          placeholder={TEXTS.placeholder}
          endIcon={<AppIcon name="phone" />}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          error={hasError}
        />
      </div>
      {/* ספק 00 §3.15: כפתור ברוחב 88px */}
      <div className="w-22 shrink-0">
        <IpsButton
          variant="contained"
          fullWidth
          disabled={!isActionEnabled}
          loading={isActionBusy}
          endIcon={<AppIcon name={actionIcon} />}
          onClick={onAction}
          sx={isDesktop ? FIELD_HEIGHT_BUTTON_SX : undefined}
        >
          {actionLabel}
        </IpsButton>
      </div>
    </div>
  );
}
