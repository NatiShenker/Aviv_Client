import { useId, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  activePermitsFor,
  daysFromToday,
  describeConditions,
  devicesSummary,
  findRestrictions,
  formatDate,
  formatRange,
  LIMIT_KINDS,
  LIMIT_OPTIONS,
  NUMBER_TYPE_LABELS,
  permitSummary,
  readNumberRecords,
  scopeLabel,
  todayISO,
  type LimitKind,
  type NumberRecord,
  type NumberRecordType,
  type RestrictionRef,
} from "@/lib/restrictions";

type Errors = Partial<Record<"phones" | "restriction" | "dates" | "duration" | "hours" | "file", string>>;

const TYPE_OPTIONS: NumberRecordType[] = ["permit", "restriction"];
const REASONS = ["מורשה לזמן מוגבל", "קשר עם בן משפחה", "קשר עם גורם טיפולי", "בקשת הורים", "בקשת גורם טיפולי", "אחר"];
const APPROVERS = ["מנהל הפנימייה", "רכז חינוך", "עובד סוציאלי", "מדריך אחראי"];
const DEVICES = ["טלפון ציבורי – אגף א", "טלפון ציבורי – אגף ב", "טלפון ציבורי – אגף ג", "טלפון משרד הפנימייה"];

const STYLES = `
@import url("https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600&display=swap");
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.native-picker::-webkit-calendar-picker-indicator { position: absolute; inset: 0; width: auto; height: auto; margin: 0; padding: 0; opacity: 0; cursor: pointer; }
`;

const normalizePhone = (value: string) => value.replace(/[\s()-]/g, "");
// Israeli landline (9 digits) or mobile (10 digits)
const isValidPhone = (phone: string) => /^0\d{8,9}$/.test(phone);

const emptyRecord = (type: NumberRecordType = "permit"): NumberRecord => ({
  id: `number-${Date.now()}`,
  type,
  phone: "",
  restriction: null,
  startDate: daysFromToday(0),
  endDate: daysFromToday(1),
  duration: null,
  startTime: "",
  endTime: "",
  devices: [],
  reason: "",
  details: "",
  approver: "",
  file: "",
});

const parseDuration = (text: string) => (text ? Number(text) : null);

const validate = (values: NumberRecord, durationText: string, limited: boolean): Errors => {
  const errors: Errors = {};
  const bounds = values.type === "permit" ? values.restriction : null;
  if (!values.startDate || !values.endDate) errors.dates = "יש לבחור תאריך התחלה ותאריך סיום";
  else if (values.endDate < values.startDate) errors.dates = "תאריך הסיום לא יכול להיות לפני תאריך ההתחלה";
  else if (bounds && (values.startDate < bounds.startDate || values.endDate > bounds.endDate))
    errors.dates = `תאריכי ההיתר חייבים להיות בתוך תקופת ההגבלה (${formatRange(bounds.startDate, bounds.endDate)})`;
  const minutes = parseDuration(durationText);
  if (limited && (minutes === null || minutes < 1 || minutes > 120))
    errors.duration = "יש להזין מספר דקות שלם בין 1 ל-120";
  if (Boolean(values.startTime) !== Boolean(values.endTime)) errors.hours = "יש לבחור שעת התחלה ושעת סיום";
  else if (values.startTime && values.endTime <= values.startTime) errors.hours = "שעת הסיום חייבת להיות אחרי שעת ההתחלה";
  if (!values.file) errors.file = "יש לצרף קובץ";
  return errors;
};

function Icon({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${/(^|\s)size-/.test(className) ? "" : "size-6"} ${className}`}
    >
      {children}
    </svg>
  );
}

const CloseIcon = ({ className = "" }: { className?: string }) => (
  <Icon className={className}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Icon>
);

const ChevronDownIcon = ({ className = "" }: { className?: string }) => (
  <Icon className={className}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

const CheckIcon = ({ className = "" }: { className?: string }) => (
  <Icon className={className}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);

const CalendarIcon = (
  <Icon>
    <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />
    <path d="M16 3v4" />
    <path d="M8 3v4" />
    <path d="M4 11h16" />
    <path d="M8 15h2v2H8z" />
  </Icon>
);

const ClockIcon = (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </Icon>
);

const TimerIcon = (
  <Icon>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2 2" />
    <path d="M10 2h4" />
  </Icon>
);

const boxClass = (invalid: boolean) =>
  `relative mt-0.5 flex h-[42px] w-full items-center gap-2 rounded-[8px] border bg-white px-4 focus-within:border-[#006aff] ${
    invalid ? "border-[#a72223]" : "border-[#8e929f]"
  }`;

const valueClass = (filled: boolean) =>
  `min-w-0 flex-1 truncate text-right text-[16px] leading-5 ${filled ? "text-[#00033d]" : "text-[#8e929f]"}`;

function FieldLabel({ text, required = false }: { text?: string; required?: boolean }) {
  return (
    <span className="block h-[18px] truncate text-[14px] leading-[18px] text-[#8e929f]">
      {text}
      {required && <span className="text-[#a72223]">*</span>}
    </span>
  );
}

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-[12px] leading-[15px] text-[#a72223]">
      {message}
    </p>
  );
}

function FieldIntro({
  title,
  description,
  compact = false,
  className = "",
}: {
  title: string;
  description: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="h-[22px] text-[14px] leading-[18px] text-[#00033d]">{title}</h3>
      <p
        title={description}
        className={`h-[22px] truncate text-[#8e929f] ${compact ? "text-[12px] leading-[15px]" : "text-[14px] leading-[18px]"}`}
      >
        {description}
      </p>
    </div>
  );
}

function NumberIcon() {
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#fef2f2] text-[#fb444c]">
      <Icon>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 7.46-2" />
        <circle cx="12" cy="16" r="1.2" />
      </Icon>
    </span>
  );
}

function RadioDot({ checked, className = "" }: { checked: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-6 shrink-0 items-center justify-center rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-[#006aff]/40 ${className}`}
    >
      <span
        className={`flex size-5 items-center justify-center rounded-full border-[#006aff] ${checked ? "border-2" : "border"}`}
      >
        {checked && <span className="size-2.5 rounded-full bg-[#006aff]" />}
      </span>
    </span>
  );
}

function RadioOption({
  name,
  checked,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}) {
  return (
    <label className="relative flex cursor-pointer items-center gap-2">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="peer sr-only" />
      <RadioDot checked={checked} />
      <span className="whitespace-nowrap text-[16px] leading-6 text-[#00033d]">{children}</span>
    </label>
  );
}

function PhoneInputRow({
  hintId,
  value,
  invalid,
  actionLabel,
  actionIcon,
  actionEnabled,
  enterKeyHint,
  onChange,
  onAction,
}: {
  hintId: string;
  value: string;
  invalid: boolean;
  actionLabel: string;
  actionIcon: ReactNode;
  actionEnabled: boolean;
  enterKeyHint: "done" | "search";
  onChange: (value: string) => void;
  onAction: () => void;
}) {
  return (
    <div className="mt-1 flex gap-2">
      <div
        className={`flex h-[42px] min-w-0 flex-1 items-center gap-2 rounded-[8px] border bg-white px-4 focus-within:border-[#006aff] ${
          invalid ? "border-[#a72223]" : "border-[#8e929f]"
        }`}
      >
        <input
          type="tel"
          inputMode="tel"
          autoComplete="off"
          enterKeyHint={enterKeyHint}
          aria-label="מספר טלפון"
          aria-describedby={hintId}
          aria-invalid={invalid}
          placeholder="הקלד"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            if (actionEnabled) onAction();
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-right text-[16px] leading-5 text-[#00033d] outline-none placeholder:text-[#8e929f]"
        />
        <Icon className="text-[#00033d]">
          <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
          <path d="M15 7a2 2 0 0 1 2 2" />
          <path d="M15 3a6 6 0 0 1 6 6" />
        </Icon>
      </div>
      <button
        type="button"
        disabled={!actionEnabled}
        onClick={onAction}
        className={`flex h-[42px] w-[88px] shrink-0 items-center justify-center gap-1 rounded-[8px] text-[16px] font-semibold leading-5 text-white transition-colors ${
          actionEnabled ? "bg-[#006aff]" : "bg-[#8e929f]"
        }`}
      >
        <span>{actionLabel}</span>
        {actionIcon}
      </button>
    </div>
  );
}

function PhoneNumbersField({
  hint,
  phones,
  draft,
  error,
  className = "",
  onDraftChange,
  onAdd,
  onRemove,
}: {
  hint: string;
  phones: string[];
  draft: string;
  error?: string;
  className?: string;
  onDraftChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (phone: string) => void;
}) {
  const hintId = useId();

  return (
    <div className={className}>
      <p id={hintId} className="text-[12px] leading-[15px] text-[#8e929f]">
        {hint}
      </p>
      <PhoneInputRow
        hintId={hintId}
        value={draft}
        invalid={Boolean(error)}
        actionLabel="הוסף"
        actionIcon={
          <Icon>
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </Icon>
        }
        actionEnabled={draft.trim() !== ""}
        enterKeyHint="done"
        onChange={onDraftChange}
        onAction={onAdd}
      />
      <ErrorText message={error} />

      {phones.length > 0 && (
        <ul aria-label="מספרים שנוספו" className="mt-2 flex flex-wrap gap-2">
          {phones.map((phone) => (
            <li
              key={phone}
              className="flex h-8 items-center gap-0.5 rounded-full bg-[#e0ebff] pl-1 pr-3 text-[14px] leading-[18px] text-[#00033d]"
            >
              <span dir="ltr">{phone}</span>
              <button
                type="button"
                aria-label={`הסרת המספר ${phone}`}
                onClick={() => onRemove(phone)}
                className="flex size-6 items-center justify-center rounded-full text-[#00033d]"
              >
                <CloseIcon className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PhoneSearchField({
  value,
  error,
  canSearch,
  className = "",
  onChange,
  onSearch,
}: {
  value: string;
  error?: string;
  canSearch: boolean;
  className?: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}) {
  const hintId = useId();

  return (
    <div className={className}>
      <p id={hintId} className="text-[12px] leading-[15px] text-[#8e929f]">
        הזן את המספר המלא כדי לאתר את ההגבלות החלות עליו עבור החניך
      </p>
      <PhoneInputRow
        hintId={hintId}
        value={value}
        invalid={Boolean(error)}
        actionLabel="חיפוש"
        actionIcon={
          <Icon className="size-5">
            <circle cx="10" cy="10" r="7" />
            <path d="m21 21-6-6" />
          </Icon>
        }
        actionEnabled={canSearch}
        enterKeyHint="search"
        onChange={onChange}
        onAction={onSearch}
      />
      <ErrorText message={error} />
    </div>
  );
}

function RestrictionLines({ restriction }: { restriction: RestrictionRef }) {
  return (
    <>
      <span className="block text-[16px] font-medium leading-5 text-[#00033d]">{scopeLabel(restriction)}</span>
      <span className="mt-1 block text-[14px] leading-[18px] text-[#8e929f]">
        <span dir="ltr">{formatRange(restriction.startDate, restriction.endDate)}</span>
        {" · "}
        {restriction.reason || "ללא סיבה"}
      </span>
    </>
  );
}

function RestrictionOption({
  restriction,
  permits,
  checked,
  onSelect,
}: {
  restriction: RestrictionRef;
  permits: string[];
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-[8px] bg-white p-4 ${
        checked ? "shadow-[inset_0_0_0_1px_#006aff]" : "shadow-[inset_0_0_0_1px_#e6e9f0]"
      }`}
    >
      <input
        type="radio"
        name="source-restriction"
        checked={checked}
        onChange={onSelect}
        // Re-clicking the chosen card has no change event, but should still close the list
        onClick={checked ? onSelect : undefined}
        className="peer sr-only"
      />
      <RadioDot checked={checked} className="-my-0.5" />
      <span className="min-w-0 flex-1">
        <RestrictionLines restriction={restriction} />
        {permits.length > 0 && (
          <span className="mt-1 block text-[14px] leading-[18px] text-[#00033d]">
            היתרים קיימים לחניך: {permits.join("; ")}
          </span>
        )}
      </span>
    </label>
  );
}

function LockedNumberCard({ record }: { record: NumberRecord }) {
  return (
    <div className="rounded-[8px] bg-white p-4 shadow-[inset_0_0_0_1px_#e6e9f0]">
      <div className="flex items-center gap-3">
        <NumberIcon />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[16px] leading-5 text-[#00033d]">
            <span dir="ltr">{record.phone}</span>
          </span>
          <span className="text-[14px] leading-[18px] text-[#8e929f]">{NUMBER_TYPE_LABELS[record.type]}</span>
        </div>
      </div>
      {record.restriction && (
        <div className="mt-3 pt-3 shadow-[inset_0_1px_0_#e6e9f0]">
          <span className="block text-[14px] leading-[18px] text-[#8e929f]">על הגבלה</span>
          <span className="mt-0.5 block">
            <RestrictionLines restriction={record.restriction} />
          </span>
        </div>
      )}
    </div>
  );
}

function PickerInput({
  type,
  label,
  ariaLabel,
  value,
  display,
  placeholder,
  muted = false,
  invalid,
  icon,
  min,
  max,
  onChange,
  onClear,
}: {
  type: "date" | "time";
  label?: string;
  ariaLabel: string;
  value: string;
  display: string;
  placeholder: string;
  muted?: boolean;
  invalid: boolean;
  icon: ReactNode;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}) {
  return (
    <div className="min-w-0">
      <FieldLabel text={label} />
      <div className={boxClass(invalid)}>
        <span className={valueClass(Boolean(value) && !muted)}>{value ? display : placeholder}</span>
        {onClear && value ? (
          <button
            type="button"
            aria-label={`ניקוי ${ariaLabel}`}
            onClick={onClear}
            className="relative z-10 flex size-6 items-center justify-center text-[#00033d]"
          >
            <CloseIcon />
          </button>
        ) : (
          <span className="text-[#00033d]">{icon}</span>
        )}
        <input
          type={type}
          aria-label={ariaLabel}
          aria-invalid={invalid}
          value={value}
          min={min}
          max={max}
          onChange={(event) => onChange(event.target.value)}
          className="native-picker absolute inset-0 size-full cursor-pointer appearance-none rounded-[8px] text-[16px] opacity-0"
        />
      </div>
    </div>
  );
}

function DurationField({
  value,
  invalid,
  autoFocus,
  onChange,
}: {
  value: string;
  invalid: boolean;
  autoFocus: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <FieldLabel text="משך מרבי לכל שיחה" required />
      <span className={boxClass(invalid)}>
        <span className="flex min-w-0 flex-1 items-center gap-1">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={3}
            autoFocus={autoFocus}
            aria-label="משך מרבי לכל שיחה בדקות (חובה)"
            aria-invalid={invalid}
            placeholder="הזן דקות"
            value={value}
            onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
            // Shrinks to the digits so the unit sits right next to the number
            style={value ? { width: `${value.length + 0.5}ch` } : undefined}
            className={`bg-transparent text-right text-[16px] leading-5 text-[#00033d] outline-none placeholder:text-[#8e929f] ${
              value ? "" : "min-w-0 flex-1"
            }`}
          />
          {value && <span className="text-[16px] leading-5 text-[#00033d]">דק'</span>}
        </span>
        {value ? (
          <button
            type="button"
            aria-label="ניקוי משך השיחה"
            onClick={() => onChange("")}
            className="relative z-10 flex size-6 items-center justify-center text-[#00033d]"
          >
            <CloseIcon />
          </button>
        ) : (
          <span className="text-[#00033d]">{TimerIcon}</span>
        )}
      </span>
    </label>
  );
}

function ConditionAccordion({
  title,
  summary,
  open,
  error,
  onToggle,
  children,
}: {
  title: string;
  summary: ReactNode;
  open: boolean;
  error?: string;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex h-10 w-full items-center gap-2 text-right text-[14px] leading-[18px] text-[#00033d]"
      >
        <span className="shrink-0">{title}</span>
        <span className="min-w-0 flex-1 truncate text-[#8e929f]">{summary}</span>
        <ChevronDownIcon className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="pb-2" style={{ animation: "fadeIn 200ms ease-out" }}>
          {children}
        </div>
      )}
      <ErrorText message={error} />
    </div>
  );
}

function ApproverField({
  label,
  value,
  placeholder,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const term = query.trim();
  const filtered = options.filter((option) => option.includes(term));

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
  };

  return (
    <div>
      <FieldLabel text={label} />
      <Popover.Root modal open={open} onOpenChange={changeOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            aria-label={`${label}: ${value || placeholder}`}
            className={`group ${boxClass(false)} outline-none focus-visible:border-[#006aff] data-[state=open]:border-[#006aff]`}
          >
            <span className={valueClass(Boolean(value))}>{value || placeholder}</span>
            <ChevronDownIcon className="text-[#00033d] transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            dir="rtl"
            align="start"
            sideOffset={4}
            collisionPadding={16}
            aria-label={label}
            className="z-[60] flex max-h-[min(360px,var(--radix-popover-content-available-height))] w-[var(--radix-popover-trigger-width)] flex-col rounded-[12px] border border-[#e6e9f0] bg-white p-2 font-['Rubik'] text-[#00033d] shadow-[0_8px_24px_rgba(0,3,61,0.12)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          >
            <div className="relative flex h-[34px] shrink-0 items-center rounded-[30px] bg-[#f6f8fe]">
              <Icon className="absolute left-4 size-5 text-[#00033d]">
                <circle cx="10" cy="10" r="7" />
                <path d="m21 21-6-6" />
              </Icon>
              <input
                type="text"
                aria-label={`חיפוש ${label}`}
                placeholder="חיפוש"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-full w-full bg-transparent pl-11 pr-4 text-right text-[16px] leading-5 text-[#00033d] outline-none placeholder:text-[#8e929f]"
              />
            </div>
            <ul className="mt-1 min-h-0 flex-1 overflow-y-auto">
              {filtered.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    aria-pressed={value === option}
                    onClick={() => {
                      onSelect(option);
                      changeOpen(false);
                    }}
                    className="flex h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-[8px] px-3 text-right text-[16px] text-[#00033d] outline-none transition-colors hover:bg-[#f6f8fe] focus-visible:bg-[#f6f8fe]"
                  >
                    <span className="truncate">{option}</span>
                    {value === option && <CheckIcon className="size-5 text-[#006aff]" />}
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="py-6 text-center text-[16px] leading-5 text-[#8e929f]">לא נמצאו תוצאות</li>
              )}
            </ul>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

function NativeSelect({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <FieldLabel text={label} />
      <span className="relative mt-0.5 block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`h-[42px] w-full cursor-pointer appearance-none rounded-[8px] border border-[#8e929f] bg-white pl-12 pr-4 text-right text-[16px] leading-5 outline-none focus:border-[#006aff] [&>option]:text-[#00033d] ${
            value ? "text-[#00033d]" : "text-[#8e929f]"
          }`}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#00033d]" />
      </span>
    </label>
  );
}

function NativeMultiSelect({
  label,
  values,
  options,
  onChange,
}: {
  label: string;
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <label className="block">
      <FieldLabel text={label} />
      <select
        multiple
        size={options.length}
        value={values}
        onChange={(event) => onChange(Array.from(event.target.selectedOptions, (option) => option.value))}
        onMouseDown={(event) => {
          // Desktop listbox: a plain click toggles one option instead of replacing the whole selection
          if (!(event.target instanceof HTMLOptionElement)) return;
          event.preventDefault();
          event.currentTarget.focus();
          const option = event.target.value;
          onChange(values.includes(option) ? values.filter((item) => item !== option) : [...values, option]);
        }}
        className="mt-0.5 block w-full cursor-pointer overflow-y-auto rounded-[8px] border border-[#8e929f] bg-white p-1 text-right text-[16px] leading-5 text-[#00033d] outline-none focus:border-[#006aff] [&>option:checked]:bg-[linear-gradient(#e0ebff,#e0ebff)] [&>option:checked]:text-[#00033d] [&>option]:rounded-[4px] [&>option]:px-3 [&>option]:py-2"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function DrawerExceptionForm({
  childId,
  record: initial,
  onClose,
  onSaved,
}: {
  childId: string;
  record?: NumberRecord;
  onClose: () => void;
  onSaved: (saved: NumberRecord[]) => void;
}) {
  const editing = Boolean(initial);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typeTitleId = useId();
  const pickerTitleId = useId();
  const records = useMemo(() => readNumberRecords(childId), [childId]);

  const [values, setValues] = useState<NumberRecord>(() => (initial ? { ...emptyRecord(), ...initial } : emptyRecord()));
  const [limit, setLimit] = useState<LimitKind>(initial?.duration != null ? "limited" : "full");
  // Focus the minutes only when the user switches, not when an existing record opens
  const [limitTouched, setLimitTouched] = useState(false);
  const [durationText, setDurationText] = useState(initial?.duration != null ? String(initial.duration) : "");
  const [phones, setPhones] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  // null until a search runs; permits always rely on one of these restrictions
  const [matches, setMatches] = useState<RestrictionRef[] | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [touchedDates, setTouchedDates] = useState({ startDate: editing, endDate: editing });
  const [hoursOpen, setHoursOpen] = useState(Boolean(initial && (initial.startTime || initial.endTime)));
  const [devicesOpen, setDevicesOpen] = useState(Boolean(initial && initial.devices.length > 0));
  const [errors, setErrors] = useState<Errors>({});

  const isPermit = values.type === "permit";
  const noun = isPermit ? "היתר" : "הגבלה";
  const limited = limit === "limited";
  const limitConfig = LIMIT_OPTIONS[values.type];

  const update = <K extends keyof NumberRecord>(key: K, value: NumberRecord[K], errorKey?: keyof Errors) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (errorKey) setErrors((current) => ({ ...current, [errorKey]: undefined }));
  };

  const changeDate = (key: "startDate" | "endDate", value: string) => {
    update(key, value, "dates");
    setTouchedDates((current) => ({ ...current, [key]: true }));
  };

  const changeLimit = (kind: LimitKind) => {
    setLimit(kind);
    setLimitTouched(true);
    setErrors((current) => ({ ...current, duration: undefined }));
  };

  const changeDuration = (text: string) => {
    setDurationText(text);
    setErrors((current) => ({ ...current, duration: undefined }));
  };

  const resetConditions = () => {
    setLimit("full");
    setLimitTouched(false);
    setDurationText("");
    setHoursOpen(false);
    setDevicesOpen(false);
  };

  const changeType = (type: NumberRecordType) => {
    if (type === values.type) return;
    setValues((current) => ({
      ...emptyRecord(type),
      id: current.id,
      reason: current.reason,
      details: current.details,
      approver: current.approver,
      file: current.file,
    }));
    resetConditions();
    setPhones([]);
    setDraft("");
    setMatches(null);
    setPickerOpen(false);
    setTouchedDates({ startDate: false, endDate: false });
    setErrors({});
  };

  const selectRestriction = (restriction: RestrictionRef) => {
    setPickerOpen(false);
    if (values.restriction?.id === restriction.id) return;
    const today = todayISO();
    setValues((current) => ({
      ...current,
      restriction,
      startDate: restriction.startDate > today ? restriction.startDate : today,
      endDate: restriction.endDate,
      startTime: "",
      endTime: "",
      devices: [],
    }));
    resetConditions();
    setTouchedDates({ startDate: true, endDate: true });
    setErrors((current) => ({ ...current, restriction: undefined, dates: undefined, duration: undefined, hours: undefined }));
  };

  const changeDraft = (value: string) => {
    setDraft(value);
    setErrors((current) => ({ ...current, phones: undefined }));
    if (isPermit && matches !== null) {
      setMatches(null);
      setPickerOpen(false);
      setValues((current) => ({ ...current, phone: "", restriction: null }));
      setErrors((current) => ({ ...current, restriction: undefined }));
    }
  };

  const searchPhone = () => {
    const phone = normalizePhone(draft);
    if (!phone) return;
    if (!isValidPhone(phone)) {
      setErrors((current) => ({ ...current, phones: "מספר טלפון לא תקין" }));
      return;
    }
    const found = findRestrictions(records, phone);
    setMatches(found);
    setValues((current) => ({ ...current, phone }));
    setErrors((current) => ({ ...current, phones: undefined, restriction: undefined }));
    if (found.length === 1) {
      selectRestriction(found[0]);
    } else {
      setValues((current) => ({ ...current, restriction: null }));
      setPickerOpen(found.length > 0);
    }
  };

  const restrictSearchedNumber = () => {
    const phone = values.phone;
    changeType("restriction");
    setPhones([phone]);
  };

  const addPhone = () => {
    const phone = normalizePhone(draft);
    if (!phone) return;
    const error = !isValidPhone(phone) ? "מספר טלפון לא תקין" : phones.includes(phone) ? "המספר כבר נוסף" : undefined;
    if (error) {
      setErrors((current) => ({ ...current, phones: error }));
      return;
    }
    setPhones((current) => [...current, phone]);
    setDraft("");
  };

  const removePhone = (phone: string) => {
    setPhones((current) => current.filter((item) => item !== phone));
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) update("file", file.name, "file");
    event.target.value = "";
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    // Until a restriction is chosen the rest of a permit form is hidden, so only the lookup is checked
    const awaitingRestriction = isPermit && !values.restriction;
    const nextErrors: Errors = awaitingRestriction ? {} : validate(values, durationText, limited);
    let nextPhones = phones;

    if (isPermit && !editing) {
      if (matches === null) nextErrors.phones = "יש להזין מספר ולחפש";
      else if (matches.length === 0) nextErrors.phones = "יש להזין מספר מוגבל ולחפש";
      else if (!values.restriction) nextErrors.restriction = "יש לבחור הגבלה";
    } else if (!isPermit && !editing) {
      const pending = normalizePhone(draft);
      if (pending && !isValidPhone(pending)) nextErrors.phones = "מספר טלפון לא תקין";
      else if (pending) {
        if (!phones.includes(pending)) nextPhones = [...phones, pending];
        setPhones(nextPhones);
        setDraft("");
      }
      if (!nextErrors.phones && nextPhones.length === 0) nextErrors.phones = "יש להוסיף לפחות מספר אחד";
    }

    setErrors(nextErrors);
    if (nextErrors.hours) setHoursOpen(true);
    if (Object.keys(nextErrors).length > 0) return;

    const record: NumberRecord = { ...values, duration: limited ? parseDuration(durationText) : null };
    const stamp = Date.now();
    const saved =
      isPermit || editing
        ? [record]
        : nextPhones.map((phone, index) => ({
            ...record,
            phone,
            id: index === 0 ? record.id : `number-${stamp}-${index}`,
          }));
    onSaved(saved);
  };

  const showDetails = !isPermit || Boolean(values.restriction);
  const showPickerList = pickerOpen || !values.restriction;
  const pickerOptions = matches && (showPickerList ? matches : matches.filter((item) => item.id === values.restriction?.id));
  const canSearch = normalizePhone(draft) !== "" && !(matches !== null && normalizePhone(draft) === values.phone);
  const bounds = isPermit ? values.restriction : null;

  const allowed = describeConditions(values, isPermit, limited);
  const hoursSummary =
    values.startTime || values.endTime ? (
      <span dir="ltr">{`${values.startTime || "--:--"}-${values.endTime || "--:--"}`}</span>
    ) : (
      allowed.hours
    );
  const devicesText = values.devices.length > 0 ? devicesSummary(values.devices) : allowed.devices;

  return (
    <div className="flex min-h-full flex-col">
      <style>{STYLES}</style>

      <form noValidate onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-4 border-b border-[#e6e9f0]">
          <h2 className="text-[20px] font-medium leading-[25px]">
            {editing ? `עריכת ${noun}` : isPermit ? "היתר חדש" : "הגבלה חדשה"}
          </h2>
          <button
            type="button"
            aria-label="סגירה ללא שמירה"
            onClick={onClose}
            className="-me-2 flex size-10 shrink-0 items-center justify-center rounded-full text-[#00033d] outline-none transition-colors hover:bg-[#f6f8fe] focus-visible:ring-2 focus-visible:ring-[#006aff]/40"
          >
            <CloseIcon />
          </button>
        </header>

        {editing ? (
          <section className="mt-8">
            <LockedNumberCard record={values} />
          </section>
        ) : (
          <section className="mt-8">
            <h2 id={typeTitleId} className="text-[16px] leading-5">
              סוג הפעולה
            </h2>
            <div role="radiogroup" aria-labelledby={typeTitleId} className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              {TYPE_OPTIONS.map((type) => (
                <RadioOption key={type} name="number-type" checked={values.type === type} onChange={() => changeType(type)}>
                  {NUMBER_TYPE_LABELS[type]}
                </RadioOption>
              ))}
            </div>

            {isPermit ? (
              <PhoneSearchField
                className="mt-[13px]"
                value={draft}
                error={errors.phones}
                canSearch={canSearch}
                onChange={changeDraft}
                onSearch={searchPhone}
              />
            ) : (
              <PhoneNumbersField
                className="mt-[13px]"
                hint="הזן מספר אחד או יותר. כל מספר יישמר כהגבלה נפרדת"
                phones={phones}
                draft={draft}
                error={errors.phones}
                onDraftChange={changeDraft}
                onAdd={addPhone}
                onRemove={removePhone}
              />
            )}

            {isPermit && matches !== null && matches.length === 0 && (
              <div
                className="mt-4 rounded-[8px] bg-white p-4 shadow-[inset_0_0_0_1px_#e6e9f0]"
                style={{ animation: "fadeIn 200ms ease-out" }}
              >
                <p className="text-[14px] leading-[18px] text-[#00033d]">
                  לא נמצאו הגבלות פעילות על המספר עבור החניך – המספר פתוח ואין צורך בהיתר
                </p>
                <button
                  type="button"
                  onClick={restrictSearchedNumber}
                  className="mt-2 flex h-6 items-center gap-0.5 text-[14px] leading-[18px] text-[#006aff]"
                >
                  <span>להגבלת המספר</span>
                  <Icon className="size-5">
                    <path d="m15 18-6-6 6-6" />
                  </Icon>
                </button>
              </div>
            )}

            {isPermit && pickerOptions && pickerOptions.length > 0 && (
              <div className="mt-4" style={{ animation: "fadeIn 200ms ease-out" }}>
                <div className="flex h-[22px] items-center justify-between gap-2">
                  <h3 id={pickerTitleId} className="text-[14px] leading-[18px] text-[#00033d]">
                    {showPickerList ? "בחר את ההגבלה שעליה יחול ההיתר" : "ההגבלה שעליה יחול ההיתר"}
                  </h3>
                  {!showPickerList && matches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="-my-2 flex h-10 shrink-0 items-center text-[14px] leading-[18px] text-[#006aff]"
                    >
                      החלפה
                    </button>
                  )}
                </div>
                {(showPickerList || matches.length === 1) && (
                  <p className="text-[12px] leading-[15px] text-[#8e929f]">
                    {matches.length === 1
                      ? "זו ההגבלה היחידה החלה על המספר עבור החניך, ולכן נבחרה"
                      : `נמצאו ${matches.length} הגבלות החלות על המספר עבור החניך`}
                  </p>
                )}
                <div role="radiogroup" aria-labelledby={pickerTitleId} className="mt-2 flex flex-col gap-2">
                  {pickerOptions.map((restriction) => (
                    <RestrictionOption
                      key={restriction.id}
                      restriction={restriction}
                      permits={activePermitsFor(records, restriction.id).map(permitSummary)}
                      checked={values.restriction?.id === restriction.id}
                      onSelect={() => selectRestriction(restriction)}
                    />
                  ))}
                </div>
                <ErrorText message={errors.restriction} />
              </div>
            )}
          </section>
        )}

        {showDetails && (
          <>
            <div className="my-8 h-px bg-[#e6e9f0]" />

            <section>
              <h2 className="text-[16px] leading-5">{isPermit ? "פרטי ההיתר" : "פרטי ההגבלה"}</h2>
              <FieldIntro
                className="mt-4"
                title="טווח תאריכים"
                description={
                  isPermit ? "ההיתר יחול בתאריכים אלו, בתוך תקופת ההגבלה" : "ההגבלה תחול בתאריכים אלו בלבד"
                }
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <PickerInput
                  type="date"
                  label="בחר תאריך"
                  ariaLabel="תאריך התחלה"
                  value={values.startDate}
                  display={values.startDate && formatDate(values.startDate)}
                  placeholder="--/--/--"
                  muted={!touchedDates.startDate}
                  invalid={Boolean(errors.dates)}
                  icon={CalendarIcon}
                  min={bounds?.startDate}
                  max={bounds?.endDate}
                  onChange={(value) => changeDate("startDate", value)}
                />
                <PickerInput
                  type="date"
                  ariaLabel="תאריך סיום"
                  value={values.endDate}
                  display={values.endDate && formatDate(values.endDate)}
                  placeholder="--/--/--"
                  muted={!touchedDates.endDate}
                  invalid={Boolean(errors.dates)}
                  icon={CalendarIcon}
                  min={values.startDate || bounds?.startDate}
                  max={bounds?.endDate}
                  onChange={(value) => changeDate("endDate", value)}
                />
              </div>
              <ErrorText message={errors.dates} />

              <FieldIntro
                className="mt-4"
                title={limitConfig.title}
                description={limitConfig.options[limit].hint}
              />
              <div
                role="radiogroup"
                aria-label={limitConfig.title}
                className="mt-2 flex flex-wrap gap-x-4 gap-y-2"
              >
                {LIMIT_KINDS.map((kind) => (
                  <RadioOption key={kind} name="limit-kind" checked={limit === kind} onChange={() => changeLimit(kind)}>
                    {limitConfig.options[kind].label}
                  </RadioOption>
                ))}
              </div>
              {limited && (
                <div className="mt-[13px] grid grid-cols-2 gap-2" style={{ animation: "fadeIn 200ms ease-out" }}>
                  <DurationField
                    value={durationText}
                    invalid={Boolean(errors.duration)}
                    autoFocus={limitTouched}
                    onChange={changeDuration}
                  />
                </div>
              )}
              <ErrorText message={errors.duration} />
            </section>

            <div className="my-8 h-px bg-[#e6e9f0]" />

            <section>
              <h2 className="text-[16px] leading-5">{isPermit ? 'הגבלה להיתר' : 'היתרים להגבלה'}</h2>
              <p className="mt-1 text-[14px] leading-[18px] text-[#8e929f]">
                {limitConfig.options[limit].conditionsHint}
              </p>
              <div className="mt-2">
                <ConditionAccordion
                  title="שעות מותרות"
                  summary={hoursSummary}
                  open={hoursOpen}
                  error={errors.hours}
                  onToggle={() => setHoursOpen((open) => !open)}
                >
                  <p className="text-[12px] leading-[15px] text-[#8e929f]">
                    השיחות יותרו רק בשעות אלו, בכל יום בטווח התאריכים
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <PickerInput
                      type="time"
                      label="בחר שעה"
                      ariaLabel="שעת התחלה"
                      value={values.startTime}
                      display={values.startTime}
                      placeholder="--:--"
                      invalid={Boolean(errors.hours)}
                      icon={ClockIcon}
                      onChange={(value) => update("startTime", value, "hours")}
                      onClear={() => update("startTime", "", "hours")}
                    />
                    <PickerInput
                      type="time"
                      ariaLabel="שעת סיום"
                      value={values.endTime}
                      display={values.endTime}
                      placeholder="--:--"
                      invalid={Boolean(errors.hours)}
                      icon={ClockIcon}
                      onChange={(value) => update("endTime", value, "hours")}
                      onClear={() => update("endTime", "", "hours")}
                    />
                  </div>
                </ConditionAccordion>

                <ConditionAccordion
                  title="מכשירים מותרים"
                  summary={devicesText}
                  open={devicesOpen}
                  onToggle={() => setDevicesOpen((open) => !open)}
                >
                  <p className="text-[12px] leading-[15px] text-[#8e929f]">השיחות יותרו רק מהמכשירים שנבחרו</p>
                  <div className="mt-2">
                    <NativeMultiSelect
                      label="בחר מכשיר"
                      values={values.devices}
                      options={DEVICES}
                      onChange={(devices) => update("devices", devices)}
                    />
                  </div>
                </ConditionAccordion>
              </div>
            </section>

            <div className="my-8 h-px bg-[#e6e9f0]" />

            <section>
              <h2 className="text-[16px] leading-5">סיבות והחלטה</h2>
              <div className="mt-4 flex flex-col gap-4">
                <NativeSelect
                  label="סיבה/הערה"
                  value={values.reason}
                  placeholder="הכל"
                  options={REASONS}
                  onChange={(reason) => update("reason", reason)}
                />
                <label className="block">
                  <FieldLabel text="פירוט" />
                  <textarea
                    rows={3}
                    placeholder="הוסף פירוט"
                    value={values.details}
                    onChange={(event) => update("details", event.target.value)}
                    className="mt-0.5 block h-24 w-full resize-none rounded-[8px] border border-[#8e929f] bg-white px-4 py-[11px] text-right text-[16px] leading-5 text-[#00033d] outline-none placeholder:text-[#8e929f] focus:border-[#006aff]"
                  />
                </label>
                <ApproverField
                  label="גורם מאשר"
                  value={values.approver}
                  placeholder="הכל"
                  options={APPROVERS}
                  onSelect={(approver) => update("approver", approver)}
                />
              </div>

              <div className="mt-4">
                <FieldLabel text="צירוף קובץ" required />
                <div className={boxClass(Boolean(errors.file))}>
                  <button
                    type="button"
                    aria-label="צירוף קובץ (חובה)"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-[8px] outline-none"
                  />
                  <span className={valueClass(Boolean(values.file))}>{values.file || "העלאת קובץ"}</span>
                  {values.file ? (
                    <button
                      type="button"
                      aria-label="הסרת הקובץ"
                      onClick={() => update("file", "")}
                      className="relative z-10 flex size-6 items-center justify-center text-[#00033d]"
                    >
                      <CloseIcon />
                    </button>
                  ) : (
                    <Icon className="text-[#00033d]">
                      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
                      <path d="M12 11v6" />
                      <path d="M9.5 13.5 12 11l2.5 2.5" />
                    </Icon>
                  )}
                  <input ref={fileInputRef} type="file" hidden onChange={onFileChange} />
                </div>
                <ErrorText message={errors.file} />
              </div>
            </section>
          </>
        )}

        <div aria-hidden="true" className="min-h-8 flex-1" />
        <div className="sticky bottom-0 z-10 -mx-8 border-t border-[#e6e9f0] bg-white px-8 py-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex h-12 items-center justify-center rounded-[8px] border border-[#006aff] bg-white text-[16px] font-semibold leading-5 text-[#006aff] transition-colors hover:bg-[#f5f9ff]"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="h-12 rounded-[8px] bg-[#006aff] text-[16px] font-semibold leading-5 text-white transition-colors hover:bg-[#0058d6]"
            >
              שמור
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
