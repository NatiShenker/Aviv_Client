import { forwardRef, useId, useImperativeHandle, useRef } from "react";
import { IpsIconButton, IpsTextField } from "ui-library";
import AppIcon from "@/shared/components/AppIcon";
import FieldLabelText from "@/shared/components/form/FieldLabelText";
import type { TextFieldProps } from "@/shared/components/form/formControls";

/**
 * שדה טקסט בדסקטופ: IpsTextField, עם התווית מעל השדה (design.md).
 * בקצה השדה: היחידה (למשל "דק׳") כשיש ערך, וכפתור ניקוי במקום האייקון - כמו בשדה של המובייל
 */
const DesktopTextField = forwardRef<HTMLInputElement, TextFieldProps>(function DesktopTextField(
  {
    id,
    label,
    "aria-label": ariaLabel,
    "aria-describedby": ariaDescribedBy,
    required,
    error,
    helperText,
    value,
    onChange,
    type,
    inputMode,
    autoComplete,
    maxLength,
    enterKeyHint,
    placeholder,
    suffix,
    endIcon,
    clearButtonLabel,
    onKeyDown,
  },
  ref,
) {
  const labelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  // הטופס מקבל את השדה עצמו (למשל כדי להעביר אליו פוקוס כשהוא מופיע)
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement, []);
  const hasValue = value !== "";
  const canClear = hasValue && Boolean(clearButtonLabel);

  // כפתור הניקוי נעלם עם הערך, ולכן הפוקוס עובר לשדה - ולא נופל לתחילת המגירה
  const clearValue = () => {
    onChange?.("");
    inputRef.current?.focus();
  };

  const fieldEnd = (
    <span className="flex items-center gap-1">
      {hasValue && suffix && <span className="text-sm text-text-muted">{suffix}</span>}
      {canClear ? (
        <IpsIconButton
          size="small"
          edge="end"
          icon={<AppIcon name="close" size="small" />}
          aria-label={clearButtonLabel}
          onClick={clearValue}
        />
      ) : (
        endIcon
      )}
    </span>
  );

  return (
    <div className="min-w-0">
      {label && <FieldLabelText id={labelId} text={label} isRequired={required} />}
      <IpsTextField
        ref={inputRef}
        id={id}
        fullWidth
        type={type}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        error={error}
        helperText={helperText}
        inputProps={{
          inputMode,
          maxLength,
          enterKeyHint,
          onKeyDown,
          "aria-label": ariaLabel,
          "aria-labelledby": label && !ariaLabel ? labelId : undefined,
          "aria-describedby": ariaDescribedBy,
          "aria-required": required,
        }}
        endAdornment={fieldEnd}
      />
    </div>
  );
});

export default DesktopTextField;
