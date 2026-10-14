import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";

interface BlockRecord {
  id: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  devices: string[];
  reason: string;
  details: string;
  approver: string;
  files: string[];
}

type Errors = Partial<Record<"dates" | "hours" | "files", string>>;

const REASONS = ["הפרת משמעת", "שימוש לא תקין בטלפון", "בקשת גורם טיפולי", "בקשת הורים", "אחר"];
const APPROVERS = ["מנהל הפנימייה", "רכז חינוך", "עובד סוציאלי", "מדריך אחראי"];
const DEVICES = ["טלפון ציבורי – אגף א", "טלפון ציבורי – אגף ב", "טלפון ציבורי – אגף ג", "טלפון משרד הפנימייה"];

const STYLES = `
@import url("https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600&display=swap");
@keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.native-picker::-webkit-calendar-picker-indicator { position: absolute; inset: 0; width: auto; height: auto; margin: 0; padding: 0; opacity: 0; cursor: pointer; }
`;

const pad = (value: number) => String(value).padStart(2, "0");
const daysFromToday = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const formatDate = (iso: string) => {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year.slice(2)}`;
};

const emptyRecord = (): BlockRecord => ({
  id: `block-${Date.now()}`,
  startDate: daysFromToday(0),
  endDate: daysFromToday(1),
  startTime: "",
  endTime: "",
  devices: [],
  reason: "",
  details: "",
  approver: "",
  files: [],
});

const validate = (values: BlockRecord): Errors => {
  const errors: Errors = {};
  if (!values.startDate || !values.endDate) errors.dates = "יש לבחור תאריך התחלה ותאריך סיום";
  else if (values.endDate < values.startDate) errors.dates = "תאריך הסיום לא יכול להיות לפני תאריך ההתחלה";
  if (Boolean(values.startTime) !== Boolean(values.endTime)) errors.hours = "יש לבחור שעת התחלה ושעת סיום";
  else if (values.startTime && values.endTime <= values.startTime) errors.hours = "שעת הסיום חייבת להיות אחרי שעת ההתחלה";
  if (values.files.length === 0) errors.files = "יש לצרף קובץ";
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

function SelectField({
  label,
  value,
  placeholder,
  onOpen,
}: {
  label: string;
  value: string;
  placeholder: string;
  onOpen: () => void;
}) {
  return (
    <div>
      <FieldLabel text={label} />
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={`${label}: ${value || placeholder}`}
        onClick={onOpen}
        className={`${boxClass(false)} outline-none focus-visible:border-[#006aff]`}
      >
        <span className={valueClass(Boolean(value))}>{value || placeholder}</span>
        <ChevronDownIcon className="text-[#00033d]" />
      </button>
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

function OptionRow({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={checked}
        onClick={onClick}
        className="flex h-14 w-full items-center justify-between gap-3 border-b border-[#ededed] text-right text-[16px] text-[#00033d]"
      >
        <span className="truncate">{label}</span>
        {checked && <CheckIcon className="size-5 text-[#006aff]" />}
      </button>
    </li>
  );
}

function OptionsSheet({
  title,
  options,
  selected,
  onClose,
  onSelect,
}: {
  title: string;
  options: string[];
  selected: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const term = query.trim();
  const filtered = options.filter((option) => option.includes(term));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" style={{ animation: "fadeIn 200ms ease-out" }}>
      <button type="button" aria-label="סגירה" onClick={onClose} className="absolute inset-0 bg-[#00033d]/40" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[85vh] w-full max-w-[375px] flex-col rounded-t-[24px] bg-white px-5 pb-8 pt-3"
        style={{ animation: "sheetUp 300ms ease-out" }}
      >
        <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-[#dfe3ec]" />
        <div className="flex h-[23px] shrink-0 items-center justify-between">
          <h2 className="text-[18px] font-medium leading-[23px] text-[#00033d]">{title}</h2>
          <button
            type="button"
            aria-label="סגירה"
            onClick={onClose}
            className="flex size-8 items-center justify-center text-[#00033d]"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="relative mt-5 flex h-[34px] shrink-0 items-center rounded-[30px] bg-[#f6f8fe]">
          <Icon className="absolute left-4 size-5 text-[#00033d]">
            <circle cx="10" cy="10" r="7" />
            <path d="m21 21-6-6" />
          </Icon>
          <input
            type="text"
            aria-label={`חיפוש ${title}`}
            placeholder="חיפוש"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-full w-full bg-transparent pl-11 pr-4 text-right text-[16px] leading-5 text-[#00033d] outline-none placeholder:text-[#8e929f]"
          />
        </div>

        <ul className="mt-2 min-h-0 flex-1 overflow-y-auto">
          {filtered.map((option) => (
            <OptionRow key={option} label={option} checked={selected === option} onClick={() => onSelect(option)} />
          ))}
          {filtered.length === 0 && (
            <li className="py-8 text-center text-[16px] leading-5 text-[#8e929f]">לא נמצאו תוצאות</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function BlockFormScreen({ childId, initial }: { childId: string; initial?: BlockRecord }) {
  const navigate = useNavigate();
  const editing = Boolean(initial);
  const listPath = `/child/${childId}/block`;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<BlockRecord>(() => (initial ? { ...emptyRecord(), ...initial } : emptyRecord()));
  const [touchedDates, setTouchedDates] = useState({ startDate: editing, endDate: editing });
  const [moreOpen, setMoreOpen] = useState(
    Boolean(initial && (initial.startTime || initial.endTime || initial.devices.length > 0)),
  );
  const [approverOpen, setApproverOpen] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const update = <K extends keyof BlockRecord>(key: K, value: BlockRecord[K], errorKey?: keyof Errors) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (errorKey) setErrors((current) => ({ ...current, [errorKey]: undefined }));
  };

  const changeDate = (key: "startDate" | "endDate", value: string) => {
    update(key, value, "dates");
    setTouchedDates((current) => ({ ...current, [key]: true }));
  };

  const onFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const names = Array.from(event.target.files ?? [], (file) => file.name);
    if (names.length > 0) update("files", names, "files");
    event.target.value = "";
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (nextErrors.hours) setMoreOpen(true);
    if (Object.keys(nextErrors).length > 0) return;
    navigate(listPath, { replace: true, state: { saved: values } });
  };

  const closeApprover = () => setApproverOpen(false);

  const fileLabel =
    values.files.length === 0 ? "העלאת קבצים" : values.files.length === 1 ? values.files[0] : `${values.files.length} קבצים`;

  return (
    <div dir="rtl" lang="he" className="min-h-screen bg-[#f6f8fe] font-['Rubik'] text-[#00033d]">
      <style>{STYLES}</style>

      <form noValidate onSubmit={handleSubmit} className="mx-auto w-full max-w-[375px] px-4 pb-[108px] pt-[50px]">
        <header className="h-[41px] shadow-[inset_0_-0.5px_0_#c5cbdd]">
          <div className="flex h-[25px] items-center justify-between gap-4">
            <h1 className="text-[20px] font-medium leading-[25px]">{editing ? "עריכת חסימה" : "חסימה חדשה"}</h1>
            <Link
              to={listPath}
              replace
              aria-label="סגירה ללא שמירה"
              className="flex size-6 shrink-0 items-center justify-center text-[#00033d]"
            >
              <CloseIcon />
            </Link>
          </div>
        </header>

        <section className="mt-6">
          <h2 className="text-[16px] leading-5">פרטי החלטה</h2>
          <FieldIntro className="mt-4" title="טווח תאריכים" description="החסימה תחול בתאריכים אלו בלבד" />
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

          <div className="mt-2 flex">
            <button
              type="button"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((open) => !open)}
              className="flex h-6 items-center gap-1.5 text-[14px] leading-[18px] text-[#00033d]"
            >
              <span>אפשרויות נוספות</span>
              <ChevronDownIcon className={`transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} />
            </button>
          </div>

          {moreOpen && (
            <div style={{ animation: "fadeIn 200ms ease-out" }}>
              <div className="mt-4">
                <FieldIntro title="טווח שעות" description="החסימה תחול בשעות אלו בלבד, בכל יום בטווח התאריכים" />
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
                <ErrorText message={errors.hours} />
              </div>

              <div className="mt-4">
                <FieldIntro
                  compact
                  title="מכשירים"
                  description="ברירת המחדל — החסימה תחול על כל המכשירים. בחר מכשירים מסוימים אם צריך"
                />
                <div className="mt-2">
                  <NativeMultiSelect
                    label="בחר מכשיר"
                    values={values.devices}
                    options={DEVICES}
                    onChange={(devices) => update("devices", devices)}
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="mb-[23.5px] mt-6 h-[0.5px] bg-[#c5cbdd]" />

        <section>
          <h2 className="text-[16px] leading-5">סיבות והחלטה</h2>
          <div className="mt-4 flex flex-col gap-2">
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
            <SelectField
              label="גורם מאשר"
              value={values.approver}
              placeholder="הכל"
              onOpen={() => setApproverOpen(true)}
            />
          </div>

          <div className="mt-4">
            <FieldLabel text="צירוף קובץ" required />
            <div className={boxClass(Boolean(errors.files))}>
              <button
                type="button"
                aria-label="צירוף קובץ (חובה)"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-[8px] outline-none"
              />
              <span className={valueClass(values.files.length > 0)}>{fileLabel}</span>
              {values.files.length > 0 ? (
                <button
                  type="button"
                  aria-label="הסרת הקבצים"
                  onClick={() => update("files", [])}
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
              <input ref={fileInputRef} type="file" multiple hidden onChange={onFilesChange} />
            </div>
            <ErrorText message={errors.files} />
          </div>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[375px] bg-[#f6f8fe] px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-3">
          <button
            type="submit"
            className="h-12 w-full rounded-[8px] bg-[#006aff] text-[16px] font-semibold leading-5 text-white"
          >
            שמור חסימה
          </button>
        </div>
      </form>

      {approverOpen && (
        <OptionsSheet
          title="גורם מאשר"
          options={APPROVERS}
          selected={values.approver}
          onClose={closeApprover}
          onSelect={(approver) => {
            update("approver", approver);
            closeApprover();
          }}
        />
      )}
    </div>
  );
}

export default function BlockForm() {
  const { id = "", recordId } = useParams();
  const location = useLocation();
  const record = (location.state as { record?: BlockRecord } | null)?.record;

  if (recordId && record?.id !== recordId) return <Navigate to={`/child/${id}/block`} replace />;

  return <BlockFormScreen key={recordId ?? "new"} childId={id} initial={recordId ? record : undefined} />;
}
