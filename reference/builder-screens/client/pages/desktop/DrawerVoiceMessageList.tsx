import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { readVoiceMessages, writeVoiceMessages, type VoiceMessageRecord } from "@/lib/voice-messages";
import { DrawerActionBar, type DrawerAction } from "./drawer-actions";

type SortKey = "start" | "end" | "status";
type Direction = "asc" | "desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "start", label: "תאריך התחלה" },
  { value: "end", label: "תאריך סיום" },
  { value: "status", label: "סטטוס" },
];

const STYLES = `
@import url("https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600&display=swap");
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes searchOpen {
  from { clip-path: inset(0 calc(100% - 34px) 0 0 round 17px); }
  to { clip-path: inset(-8px round 25px); }
}
@media (prefers-reduced-motion: no-preference) { .search-open { animation: searchOpen 200ms ease-out; } }
`;

const pad = (value: number) => String(value).padStart(2, "0");
const toISO = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const formatDate = (iso: string) => {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year.slice(2)}`;
};
const formatRange = (record: VoiceMessageRecord) => `${formatDate(record.startDate)}-${formatDate(record.endDate)}`;
const isActive = (record: VoiceMessageRecord) => record.endDate >= toISO(new Date());

const searchableText = (record: VoiceMessageRecord) =>
  [
    record.scope === "all" ? "כל השיחות" : "",
    ...record.phones,
    record.reason,
    record.details,
    record.approver,
    ...record.devices,
    formatRange(record),
    record.startDate,
    record.endDate,
  ].join(" ");

const compareBy = (a: VoiceMessageRecord, b: VoiceMessageRecord, key: SortKey) => {
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
      className="-my-[3px] flex h-10 shrink-0 items-center gap-1 rounded-[8px] px-2 text-[14px] leading-[18px] text-[#00033d] transition-colors hover:bg-[#f6f8fe]"
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

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`flex h-5 shrink-0 items-center rounded-full px-2 text-[10px] leading-3 ${
        active ? "bg-[#e7ffef] text-[#069940]" : "bg-[#f6f9fc] text-[#c5cbdd]"
      }`}
    >
      {active ? "פעילה" : "הסתיים"}
    </span>
  );
}

function ScopeSummary({ record }: { record: VoiceMessageRecord }) {
  if (record.scope === "all") return <span className="truncate">כל השיחות</span>;
  const extra = record.phones.length - 1;
  return (
    <span className="flex items-center gap-1 whitespace-nowrap">
      <span dir="ltr">{record.phones[0]}</span>
      {extra > 0 && (
        <>
          <span dir="ltr" aria-hidden="true">
            +{extra}
          </span>
          <span className="sr-only">ועוד {extra} מספרים</span>
        </>
      )}
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

function VoiceMessageCard({
  record,
  open,
  onToggle,
  onEdit,
}: {
  record: VoiceMessageRecord;
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const hasHours = Boolean(record.startTime && record.endTime);
  const allCalls = record.scope === "all";

  return (
    <article className="rounded-[8px] bg-white p-4 shadow-[inset_0_0_0_1px_#e6e9f0]">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center gap-3 rounded-[4px] text-right outline-none focus-visible:ring-2 focus-visible:ring-[#006aff]/40 focus-visible:ring-offset-4"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#e0ebff] text-[#006aff]">
          <Icon>
            <rect x="6.5" y="4" width="6" height="10" rx="3" />
            <path d="M3.5 11a6 6 0 0 0 12 0M9.5 17v4M6.5 21h6" />
            <path d="M18.5 2.5v6M15.5 5.5h6" />
          </Icon>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex min-w-0 items-center gap-2 text-[16px] leading-5 text-[#8e929f]">
            <ScopeSummary record={record} />
            <StatusBadge active={isActive(record)} />
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
            <Detail label="תאריכים" value={formatRange(record)} ltr />
            <Detail
              label="שעות"
              value={hasHours ? `${record.startTime}-${record.endTime}` : "כל היום"}
              ltr={hasHours}
            />
            <Detail
              label="היקף ההפעלה"
              value={allCalls ? "בכל השיחות" : record.phones.join("\n")}
              ltr={!allCalls}
            />
            <Detail label="חזרה במהלך השיחה" value={record.repeat ? "כן" : "לא"} />
            <Detail label="סיבה" value={record.reason || "לא צוין"} />
            <Detail label="מכשירים" value={record.devices.length ? record.devices.join(", ") : "כל המכשירים"} />
            <Detail label="גורם מאשר" value={record.approver || "לא צוין"} />
            {record.details && <Detail label="פירוט" value={record.details} className="col-span-2" />}
          </dl>
          <button
            type="button"
            onClick={onEdit}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[8px] border border-[#006aff] bg-white text-[16px] leading-5 text-[#006aff] transition-colors hover:bg-[#f5f9ff]"
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

function SortMenu({
  showLabel,
  sortKey,
  sortDir,
  onSortKeyChange,
  onToggleDir,
}: {
  showLabel: boolean;
  sortKey: SortKey;
  sortDir: Direction;
  onSortKeyChange: (key: SortKey) => void;
  onToggleDir: () => void;
}) {
  return (
    <DropdownMenu.Root dir="rtl">
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="מיון"
          className="-my-[3px] flex h-10 shrink-0 items-center gap-1 rounded-[8px] px-2 text-[14px] leading-[18px] text-[#00033d] outline-none transition-colors hover:bg-[#f6f8fe] focus-visible:ring-2 focus-visible:ring-[#006aff]/40 data-[state=open]:bg-[#f6f8fe]"
        >
          <Icon className="size-5">
            <path d="M7 3v18" />
            <path d="M10 6 7 3 4 6" />
            <path d="m20 18-3 3-3-3" />
            <path d="M17 21V3" />
          </Icon>
          {showLabel && <span className="whitespace-nowrap">מיון</span>}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-[60] w-[240px] rounded-[12px] border border-[#e6e9f0] bg-white p-1.5 font-['Rubik'] text-[#00033d] shadow-[0_8px_24px_rgba(0,3,61,0.12)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <DropdownMenu.Label className="px-3 pb-1 pt-1.5 text-[14px] leading-[18px] text-[#8e929f]">מיון</DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={sortKey} onValueChange={(value) => onSortKeyChange(value as SortKey)}>
            {SORT_OPTIONS.map((option) => (
              <DropdownMenu.RadioItem
                key={option.value}
                value={option.value}
                // Stays open like the mobile sheet, so the direction can be changed too
                onSelect={(event) => event.preventDefault()}
                className="flex h-11 cursor-pointer select-none items-center justify-between rounded-[8px] px-3 text-[16px] outline-none data-[highlighted]:bg-[#f6f8fe]"
              >
                <span>{option.label}</span>
                <DropdownMenu.ItemIndicator>
                  <Icon className="size-5">
                    <path d="M20 6 9 17l-5-5" />
                  </Icon>
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
          <DropdownMenu.Separator className="mx-1 my-1 h-px bg-[#ededed]" />
          <DropdownMenu.Item
            onSelect={(event) => {
              event.preventDefault();
              onToggleDir();
            }}
            className="flex h-11 cursor-pointer select-none items-center justify-between rounded-[8px] px-3 text-[16px] outline-none data-[highlighted]:bg-[#f6f8fe]"
          >
            <span>כיוון מיון</span>
            <span className="flex items-center gap-1 text-[#8e929f]">
              {sortDir === "asc" ? "עולה" : "יורד"}
              <Icon className={`size-4 ${sortDir === "desc" ? "rotate-180" : ""}`}>
                <path d="M12 19V5M5 12l7-7 7 7" />
              </Icon>
            </span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export default function DrawerVoiceMessageList({
  childId: id,
  saved: savedRecord,
  onBack,
  onSwitchAction,
  onNew,
  onEdit,
}: {
  childId: string;
  saved?: VoiceMessageRecord;
  onBack: () => void;
  onSwitchAction: (action: DrawerAction) => void;
  onNew: () => void;
  onEdit: (record: VoiceMessageRecord) => void;
}) {
  const [records] = useState<VoiceMessageRecord[]>(() => {
    const stored = readVoiceMessages(id);
    if (!savedRecord) return stored;
    return stored.some((record) => record.id === savedRecord.id)
      ? stored.map((record) => (record.id === savedRecord.id ? savedRecord : record))
      : [savedRecord, ...stored];
  });
  const [openId, setOpenId] = useState<string | null>(savedRecord?.id ?? null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("start");
  const [sortDir, setSortDir] = useState<Direction>("desc");
  const searchRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    writeVoiceMessages(id, records);
  }, [id, records]);

  useEffect(() => {
    if (searching) searchRef.current?.focus();
  }, [searching]);

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

  return (
    <div className="pb-8">
      <style>{STYLES}</style>

      <DrawerActionBar action="voice-message" onBack={onBack} onSwitchAction={onSwitchAction} onNew={onNew} />

      <section className="mt-9">
        <div className="flex h-[34px] items-center justify-between gap-2">
          <h2 className={searching ? "sr-only" : "whitespace-nowrap text-[18px] font-medium leading-[23px]"}>
            הסטוריית הודעות קוליות
          </h2>
          {searching && (
            <SearchField
              inputRef={searchRef}
              value={query}
              label="חיפוש הודעות קוליות"
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
            <SortMenu
              showLabel={!searching}
              sortKey={sortKey}
              sortDir={sortDir}
              onSortKeyChange={setSortKey}
              onToggleDir={() => setSortDir((dir) => (dir === "asc" ? "desc" : "asc"))}
            />
          </div>
        </div>

        <ul className="mt-3 flex flex-col gap-4">
          {visibleRecords.map((record) => (
            <li key={record.id}>
              <VoiceMessageCard
                record={record}
                open={openId === record.id}
                onToggle={() => setOpenId((current) => (current === record.id ? null : record.id))}
                onEdit={() => onEdit(record)}
              />
            </li>
          ))}
        </ul>

        {visibleRecords.length === 0 && (
          <p className="mt-16 text-center text-[16px] leading-5 text-[#8e929f]">לא נמצאו הודעות קוליות</p>
        )}
      </section>
    </div>
  );
}
