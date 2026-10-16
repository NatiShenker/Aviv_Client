import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  describeConditions,
  formatRange,
  hasHours,
  limitTypeLabel,
  NUMBER_TYPE_LABELS,
  readNumberRecords,
  scopeLabel,
  todayISO,
  writeNumberRecords,
  type NumberRecord,
  type NumberRecordType,
} from "@/lib/restrictions";

type SortKey = "start" | "end" | "status";
type Direction = "asc" | "desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "start", label: "תאריך התחלה" },
  { value: "end", label: "תאריך סיום" },
  { value: "status", label: "סטטוס" },
];

const STYLES = `
@import url("https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600&display=swap");
@keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes searchOpen {
  from { clip-path: inset(0 calc(100% - 34px) 0 0 round 17px); }
  to { clip-path: inset(-8px round 25px); }
}
@media (prefers-reduced-motion: no-preference) { .search-open { animation: searchOpen 200ms ease-out; } }
`;

const TYPE_TAGS: Record<NumberRecordType, string> = { permit: "היתר", restriction: "הגבלה" };

const recordRange = (record: NumberRecord) => formatRange(record.startDate, record.endDate);
const isActive = (record: NumberRecord) => record.endDate >= todayISO();

const mergeSaved = (stored: NumberRecord[], saved: NumberRecord[]) => {
  const added = saved.filter((record) => !stored.some((item) => item.id === record.id));
  const updated = stored.map((record) => saved.find((item) => item.id === record.id) ?? record);
  return [...added, ...updated];
};

const searchableText = (record: NumberRecord) => {
  const allowed = describeConditions(record, record.type === "permit");
  return [
    record.phone,
    NUMBER_TYPE_LABELS[record.type],
    limitTypeLabel(record.duration, record.type === "permit"),
    record.restriction ? scopeLabel(record.restriction) : "",
    record.reason,
    record.details,
    record.approver,
    allowed.hours,
    allowed.devices,
    recordRange(record),
    record.startDate,
    record.endDate,
  ]
    .join(" ")
    .replace(/\u00a0/g, " ");
};

const compareBy = (a: NumberRecord, b: NumberRecord, key: SortKey) => {
  if (key === "end") return a.endDate.localeCompare(b.endDate);
  if (key === "status") return Number(isActive(a)) - Number(isActive(b)) || a.startDate.localeCompare(b.startDate);
  return a.startDate.localeCompare(b.startDate);
};

function Icon({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeMiterlimit={10}
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

const SearchIcon = ({ className = "" }: { className?: string }) => (
  <Icon className={`size-5 ${className}`}>
    <circle cx="10" cy="10" r="7" />
    <path d="m21 21-6-6" />
  </Icon>
);

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

function ToolbarButton({
  label,
  showLabel,
  buttonRef,
  onClick,
  children,
}: {
  label: string;
  showLabel: boolean;
  buttonRef?: RefObject<HTMLButtonElement>;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={label}
      // Keeps the search field focused so its blur can't reflow the row mid-click
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="-my-[3px] flex h-10 shrink-0 items-center gap-1 px-2 text-[14px] leading-[18px] text-[#00033d]"
    >
      {children}
      {showLabel && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}

function SearchField({
  inputRef,
  value,
  label,
  placeholder,
  onChange,
  onClose,
}: {
  inputRef: RefObject<HTMLInputElement>;
  value: string;
  label: string;
  placeholder: string;
  onChange: (value: string) => void;
  onClose: (restoreFocus: boolean) => void;
}) {
  return (
    <div className="search-open relative h-[34px] min-w-0 flex-1 rounded-full bg-white shadow-[0_1px_2px_rgba(0,3,61,0.06),0_2px_8px_rgba(0,3,61,0.04)]">
      <SearchIcon className="pointer-events-none absolute right-3 top-[7px] text-[#00033d]" />
      <input
        ref={inputRef}
        type="search"
        enterKeyHint="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => event.key === "Escape" && onClose(true)}
        onBlur={() => value.trim() === "" && onClose(false)}
        className="size-full min-w-0 text-ellipsis rounded-full bg-transparent px-10 text-right text-[16px] leading-5 text-[#00033d] outline-none placeholder:text-[#8e929f] [&::-webkit-search-cancel-button]:hidden"
      />
      <button
        type="button"
        aria-label="סגירת חיפוש"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onClose(false)}
        className="absolute inset-y-0 left-0 flex w-10 items-center justify-center text-[#8e929f]"
      >
        <CloseIcon className="size-[18px]" />
      </button>
    </div>
  );
}

function TypeTag({ type }: { type: NumberRecordType }) {
  return (
    <span className="flex h-5 shrink-0 items-center rounded-full bg-[#e0ebff] px-2 text-[10px] leading-3 text-[#00033d]">
      {TYPE_TAGS[type]}
    </span>
  );
}

function StatusBadge({ active, masculine = false }: { active: boolean; masculine?: boolean }) {
  return (
    <span
      className={`flex h-5 shrink-0 items-center rounded-full px-2 text-[10px] leading-3 ${
        active ? "bg-[#e7ffef] text-[#069940]" : "bg-[#f6f9fc] text-[#c5cbdd]"
      }`}
    >
      {active ? (masculine ? "פעיל" : "פעילה") : "הסתיים"}
    </span>
  );
}

function Detail({
  label,
  value,
  ltr = false,
  className = "",
}: {
  label: string;
  value: string;
  ltr?: boolean;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="text-[14px] leading-[18px] text-[#8e929f]">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line break-words text-[16px] leading-5 text-[#00033d]">
        {ltr ? <span dir="ltr">{value}</span> : value}
      </dd>
    </div>
  );
}

function ExceptionCard({
  record,
  open,
  onToggle,
  onEdit,
}: {
  record: NumberRecord;
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const isPermit = record.type === "permit";
  const allowed = describeConditions(record, isPermit);

  return (
    <article className="rounded-[8px] bg-white p-4 shadow-[inset_0_0_0_0.5px_#c5cbdd]">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center gap-3 text-right"
      >
        <NumberIcon />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center gap-2">
            <span dir="ltr" className="whitespace-nowrap text-[16px] leading-5 text-[#8e929f]">
              {record.phone}
            </span>
            <TypeTag type={record.type} />
            <StatusBadge active={isActive(record)} masculine={isPermit} />
          </span>
          <span className="truncate text-[16px] leading-5 text-[#00033d]">{record.reason || "ללא סיבה"}</span>
        </span>
        <Icon className={`text-[#0c3058] transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" />
        </Icon>
      </button>

      {open && (
        <div className="mt-4" style={{ animation: "fadeIn 200ms ease-out" }}>
          <dl className="grid grid-cols-2 gap-y-4">
            <Detail label="סוג" value={limitTypeLabel(record.duration, isPermit)} />
            <Detail label="תאריכים" value={recordRange(record)} ltr />
            {record.restriction && (
              <Detail
                label="על הגבלה"
                value={`${scopeLabel(record.restriction)} · ${formatRange(record.restriction.startDate, record.restriction.endDate)}`}
                className="col-span-2"
              />
            )}
            <Detail label="שעות מותרות" value={allowed.hours} ltr={hasHours(record)} />
            <Detail label="מכשירים מותרים" value={allowed.devices} />
            <Detail label="סיבה" value={record.reason || "לא צוין"} />
            <Detail label="גורם מאשר" value={record.approver || "לא צוין"} />
            {record.details && <Detail label="פירוט" value={record.details} className="col-span-2" />}
          </dl>
          <button
            type="button"
            onClick={onEdit}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[8px] border border-[#006aff] bg-white text-[16px] leading-5 text-[#006aff]"
          >
            <span>עריכה</span>
            <Icon>
              <path d="M7 7H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-1" />
              <path d="M21 5.1c0 .557-.221 1.091-.615 1.485L12 15H9v-3l8.415-8.385A2.1 2.1 0 0 1 21 5.1Z" />
              <path d="m16 5 3 3" />
            </Icon>
          </button>
        </div>
      )}
    </article>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50" style={{ animation: "fadeIn 200ms ease-out" }}>
      <button type="button" aria-label="סגירה" onClick={onClose} className="absolute inset-0 bg-[#00033d]/40" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[375px] rounded-t-[24px] bg-white px-5 pb-8 pt-3"
        style={{ animation: "sheetUp 300ms ease-out" }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#dfe3ec]" />
        <div className="flex h-[23px] items-center justify-between">
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
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export default function ExceptionList() {
  const { id = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const savedRecords = (location.state as { saved?: NumberRecord[] } | null)?.saved;

  const [records] = useState<NumberRecord[]>(() => {
    const stored = readNumberRecords(id);
    return savedRecords ? mergeSaved(stored, savedRecords) : stored;
  });
  const [openId, setOpenId] = useState<string | null>(savedRecords?.[0]?.id ?? null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("start");
  const [sortDir, setSortDir] = useState<Direction>("desc");
  const [sortOpen, setSortOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    writeNumberRecords(id, records);
  }, [id, records]);

  // Drop the saved records from history so back/forward can't re-apply a stale version
  useEffect(() => {
    if (savedRecords) navigate(location.pathname, { replace: true, state: null });
  }, [savedRecords, navigate, location.pathname]);

  useEffect(() => {
    if (searching) searchRef.current?.focus();
  }, [searching]);

  useEffect(() => {
    if (!sortOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSortOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sortOpen]);

  const visibleRecords = useMemo(() => {
    const term = query.trim();
    const factor = sortDir === "asc" ? 1 : -1;
    return records
      .filter((record) => term === "" || searchableText(record).includes(term))
      .sort((a, b) => factor * compareBy(a, b, sortKey));
  }, [records, query, sortKey, sortDir]);

  const closeSearch = (restoreFocus: boolean) => {
    setSearching(false);
    setQuery("");
    if (restoreFocus) requestAnimationFrame(() => searchButtonRef.current?.focus());
  };

  const openSort = () => {
    searchRef.current?.blur();
    setSortOpen(true);
  };

  return (
    <div dir="rtl" lang="he" className="min-h-screen bg-[#f6f8fe] font-['Rubik'] text-[#00033d]">
      <style>{STYLES}</style>

      <main className="mx-auto w-full max-w-[375px] px-4 pb-[108px] pt-[50px]">
        <header className="h-[41px] shadow-[inset_0_-0.5px_0_#c5cbdd]">
          <div className="flex h-[25px] items-center gap-4">
            <Link to={`/child/${id}`} aria-label="חזרה" className="flex size-6 shrink-0 items-center justify-center">
              <Icon className="text-[#00033d]">
                <path d="M14.43 5.93 20.5 12l-6.07 6.07" />
                <path d="M3.5 12h16.83" />
              </Icon>
            </Link>
            <h1 className="text-[20px] font-medium leading-[25px]">הגבלה/היתר למספר</h1>
          </div>
        </header>

        {/* 17 + (34 - 20) / 2 keeps the icons 24px below the divider, as in the design */}
        <section className="mt-[17px]">
          <div className="flex h-[34px] items-center justify-between gap-2">
            <h2 className={searching ? "sr-only" : "whitespace-nowrap text-[16px] leading-5"}>הסטוריית הגבלות והיתרים</h2>
            {searching && (
              <SearchField
                inputRef={searchRef}
                value={query}
                label="חיפוש הגבלות והיתרים"
                placeholder="חיפוש לפי מספר, סיבה או תאריך"
                onChange={setQuery}
                onClose={closeSearch}
              />
            )}
            <div className="-ml-2 flex shrink-0 items-center">
              {!searching && (
                <ToolbarButton
                  label="חיפוש"
                  showLabel={false}
                  buttonRef={searchButtonRef}
                  onClick={() => setSearching(true)}
                >
                  <SearchIcon />
                </ToolbarButton>
              )}
              <ToolbarButton label="מיון" showLabel={!searching} onClick={openSort}>
                <Icon className="size-5">
                  <path d="M7 3v18" />
                  <path d="M10 6 7 3 4 6" />
                  <path d="m20 18-3 3-3-3" />
                  <path d="M17 21V3" />
                </Icon>
              </ToolbarButton>
            </div>
          </div>

          <ul className="mt-[13px] flex flex-col gap-2">
            {visibleRecords.map((record) => (
              <li key={record.id}>
                <ExceptionCard
                  record={record}
                  open={openId === record.id}
                  onToggle={() => setOpenId((current) => (current === record.id ? null : record.id))}
                  onEdit={() => navigate(`/child/${id}/exception/${record.id}/edit`, { state: { record } })}
                />
              </li>
            ))}
          </ul>

          {visibleRecords.length === 0 && (
            <p className="mt-16 text-center text-[16px] leading-5 text-[#8e929f]">לא נמצאו הגבלות או היתרים</p>
          )}
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[375px] bg-[#f6f8fe] px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-3">
        <Link
          to={`/child/${id}/exception/new`}
          className="flex h-12 w-full items-center justify-center gap-1 rounded-[8px] bg-[#006aff] text-[16px] font-semibold leading-5 text-white"
        >
          <span>הוספת הגבלה/היתר</span>
          <Icon className="text-white">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </Icon>
        </Link>
      </div>

      {sortOpen && (
        <Sheet title="מיון" onClose={() => setSortOpen(false)}>
          <div className="flex flex-col">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={sortKey === option.value}
                onClick={() => setSortKey(option.value)}
                className="flex h-14 items-center justify-between border-b border-[#ededed] text-[16px] text-[#00033d]"
              >
                <span>{option.label}</span>
                {sortKey === option.value && (
                  <Icon className="size-5">
                    <path d="M20 6 9 17l-5-5" />
                  </Icon>
                )}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSortDir((dir) => (dir === "asc" ? "desc" : "asc"))}
              className="flex h-14 items-center justify-between border-b border-[#ededed] text-[16px] text-[#00033d]"
            >
              <span>כיוון מיון</span>
              <span className="flex items-center gap-1 text-[#8e929f]">
                {sortDir === "asc" ? "עולה" : "יורד"}
                <Icon className={`size-4 ${sortDir === "desc" ? "rotate-180" : ""}`}>
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </Icon>
              </span>
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
