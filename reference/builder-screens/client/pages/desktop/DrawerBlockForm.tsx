import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  daysFromToday,
  describeConditions,
  devicesSummary,
  formatDate,
  LIMIT_KINDS,
  LIMIT_OPTIONS,
  type LimitKind,
  type TraineeRestriction,
} from "@/lib/restrictions";

type Errors = Partial<Record<"dates" | "duration" | "hours" | "file", string>>;

const REASONS = ["הפרת משמעת", "שימוש לא תקין בטלפון", "בקשת גורם טיפולי", "בקשת הורים", "אחר"];
const APPROVERS = ["מנהל הפנימייה", "רכז חינוך", "עובד סוציאלי", "מדריך אחראי"];
const DEVICES = ["טלפון ציבורי – אגף א", "טלפון ציבורי – אגף ב", "טלפון ציבורי – אגף ג", "טלפון משרד הפנימייה"];

const STYLES = `
@import url("https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600&display=swap");
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.native-picker::-webkit-calendar-picker-indicator { position: absolute; inset: 0; width: auto; height: auto; margin: 0; padding: 0; opacity: 0; cursor: pointer; }
`;

const emptyRecord = (): TraineeRestriction => ({
  id: `restriction-${Date.now()}`,
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

const LIMIT = LIMIT_OPTIONS.restriction;

const parseDuration = (text: string) => (text ? Number(text) : null);

const validate = (values: TraineeRestriction, durationText: string, limited: boolean): Errors => {
  const errors: Errors = {};
  if (!values.startDate || !values.endDate) errors.dates = "יש לבחור תאריך התחלה ותאריך סיום";
  else if (values.endDate < values.startDate) errors.dates = "תאריך הסיום לא יכול להיות לפני תאריך ההתחלה";
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
          onChange={(event) => onChange(event.target.value)}
          className="native-picker absolute inset-0 size-full cursor-pointer appearance-none rounded-[8px] text-[16px] opacity-0"
        />
      </div>
    </div>
  );
}

function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-6 shrink-0 items-center justify-center rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-[#006aff]/40"
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

export default function DrawerBlockForm({
  record: initial,
  onClose,
  onSaved,
}: {
  record?: TraineeRestriction;
  onClose: () => void;
  onSaved: (saved: TraineeRestriction) => void;
}) {
  const editing = Boolean(initial);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<TraineeRestriction>(() =>
    initial ? { ...emptyRecord(), ...initial } : emptyRecord(),
  );
  const [limit, setLimit] = useState<LimitKind>(initial?.duration != null ? "limited" : "full");
  // Focus the minutes only when the user switches, not when an existing record opens
  const [limitTouched, setLimitTouched] = useState(false);
  const [durationText, setDurationText] = useState(initial?.duration != null ? String(initial.duration) : "");
  const [touchedDates, setTouchedDates] = useState({ startDate: editing, endDate: editing });
  const [hoursOpen, setHoursOpen] = useState(Boolean(initial && (initial.startTime || initial.endTime)));
  const [devicesOpen, setDevicesOpen] = useState(Boolean(initial && initial.devices.length > 0));
  const [errors, setErrors] = useState<Errors>({});

  const limited = limit === "limited";

  const update = <K extends keyof TraineeRestriction>(
    key: K,
    value: TraineeRestriction[K],
    errorKey?: keyof Errors,
  ) => {
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

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) update("file", file.name, "file");
    event.target.value = "";
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(values, durationText, limited);
    setErrors(nextErrors);
    if (nextErrors.hours) setHoursOpen(true);
    if (Object.keys(nextErrors).length > 0) return;
    const saved: TraineeRestriction = { ...values, duration: limited ? parseDuration(durationText) : null };
    onSaved(saved);
  };

  const allowed = describeConditions(values, false, limited);
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
          <h2 className="text-[20px] font-medium leading-[25px]">{editing ? "עריכת הגבלה" : "הגבלה חדשה"}</h2>
          <button
            type="button"
            aria-label="סגירה ללא שמירה"
            onClick={onClose}
            className="-me-2 flex size-10 shrink-0 items-center justify-center rounded-full text-[#00033d] outline-none transition-colors hover:bg-[#f6f8fe] focus-visible:ring-2 focus-visible:ring-[#006aff]/40"
          >
            <CloseIcon />
          </button>
        </header>

        <section className="mt-8">
          <h2 className="text-[16px] leading-5">פרטי ההגבלה</h2>
          <FieldIntro className="mt-4" title="טווח תאריכים" description="ההגבלה תחול בתאריכים אלו בלבד" />
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
              min={values.startDate || undefined}
              onChange={(value) => changeDate("endDate", value)}
            />
          </div>
          <ErrorText message={errors.dates} />

          <FieldIntro className="mt-4" title={LIMIT.title} description={LIMIT.options[limit].hint} />
          <div role="radiogroup" aria-label={LIMIT.title} className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            {LIMIT_KINDS.map((kind) => (
              <RadioOption key={kind} name="limit-kind" checked={limit === kind} onChange={() => changeLimit(kind)}>
                {LIMIT.options[kind].label}
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
          <h2 className="text-[16px] leading-5">היתרים להגבלה</h2>
          <p className="mt-1 text-[14px] leading-[18px] text-[#8e929f]">{LIMIT.options[limit].conditionsHint}</p>
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

        <div aria-hidden="true" className="min-h-8 flex-1" />
        <div className="sticky bottom-0 z-10 -mx-8 border-t border-[#e6e9f0] bg-white px-8 py-4">
          <button
            type="submit"
            className="h-12 w-full rounded-[8px] bg-[#006aff] text-[16px] font-semibold leading-5 text-white transition-colors hover:bg-[#0058d6]"
          >
            שמור הגבלה
          </button>
        </div>
      </form>
    </div>
  );
}
