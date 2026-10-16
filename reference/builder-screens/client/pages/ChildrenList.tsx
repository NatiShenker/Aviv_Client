import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Link } from "react-router-dom";

type Status = "active" | "blocked";
type Wing = "א" | "ב" | "ג";
type SortKey = "name" | "date" | "time";
type Direction = "asc" | "desc";
type Drawer = "filter" | "sort";

interface Child {
  id: number;
  name: string;
  date: string;
  status: Status;
  blockedUntil?: string;
  minutes: number;
  wing: Wing;
  photo?: string;
}

const CHILDREN: Child[] = [
  { id: 1, name: "יוסי כהן | 012453", date: "2023-04-16", status: "active", minutes: 45, wing: "א" },
  { id: 2, name: "יוסי כהן | 012453", date: "2023-04-16", status: "blocked", blockedUntil: "25/06", minutes: 45, wing: "א" },
  { id: 3, name: "יוסי כהן | 012453", date: "2023-04-16", status: "active", minutes: 45, wing: "א" },
  { id: 4, name: "יוסי כהן | 012453", date: "2023-04-16", status: "active", minutes: 45, wing: "א" },
  { id: 5, name: "יוסי כהן | 012453", date: "2023-04-16", status: "active", minutes: 45, wing: "א" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "הכל" },
  { value: "active", label: "פעיל" },
  { value: "blocked", label: "חסום" },
] as const;

const WING_OPTIONS = [
  { value: "all", label: "הכל" },
  { value: "א", label: "אגף א" },
  { value: "ב", label: "אגף ב" },
  { value: "ג", label: "אגף ג" },
] as const;

const SORT_OPTIONS = [
  { value: "name", label: "שם" },
  { value: "date", label: "תאריך אחרון" },
  { value: "time", label: "זמן שהייה" },
] as const;

const STYLES = `
@import url("https://fonts.googleapis.com/css2?family=Rubik:wght@400;500&display=swap");
@keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes searchOpen {
  from { clip-path: inset(0 calc(100% - 34px) 0 0 round 17px); }
  to { clip-path: inset(-8px round 25px); }
}
@media (prefers-reduced-motion: no-preference) { .search-open { animation: searchOpen 200ms ease-out; } }
`;

const formatDate = (iso: string) => {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year.slice(2)}`;
};

const compareBy = (a: Child, b: Child, key: SortKey) => {
  if (key === "name") return a.name.localeCompare(b.name, "he");
  if (key === "date") return a.date.localeCompare(b.date);
  return a.minutes - b.minutes;
};

function Icon({
  className = "",
  strokeWidth = 1.6,
  children,
}: {
  className?: string;
  strokeWidth?: number;
  children: ReactNode;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${/(^|\s)size-/.test(className) ? "" : "size-5"} ${className}`}
    >
      {children}
    </svg>
  );
}

const SearchIcon = ({ className = "" }: { className?: string }) => (
  <Icon className={className} strokeWidth={1.5}>
    <circle cx="10" cy="10" r="7" />
    <path d="m21 21-6-6" />
  </Icon>
);

function ToolbarButton({
  label,
  showLabel,
  active = false,
  buttonRef,
  onClick,
  children,
}: {
  label: string;
  showLabel: boolean;
  active?: boolean;
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
      className={`-my-[3px] flex h-10 shrink-0 items-center gap-1 px-2 text-[14px] leading-[18px] transition-colors ${
        active ? "text-[#006aff]" : "text-[#00033d]"
      }`}
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
        <Icon className="size-[18px]" strokeWidth={1.5}>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </Icon>
      </button>
    </div>
  );
}

function StatusBadge({ child }: { child: Child }) {
  const blocked = child.status === "blocked";
  return (
    <span
      className={`flex h-[23.54px] shrink-0 items-center gap-1.5 rounded-full px-2 text-[12px] leading-[14px] ${
        blocked ? "bg-[#ffe8e8] text-[#d4262b]" : "bg-[#e7ffef] text-[#15833a]"
      }`}
    >
      <span className={`size-1.5 rounded-full ${blocked ? "bg-[#ff3b3b]" : "bg-[#22c55e]"}`} />
      {blocked ? `מוגבל עד ${child.blockedUntil}` : "פעיל"}
    </span>
  );
}

function ChildCard({ child }: { child: Child }) {
  return (
    <article className="rounded-[19px] border-[0.5px] border-[#ededed] bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-[11px]">
          <div className="flex size-[60px] shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-gradient-to-b from-[#d5dce9] to-[#9aa5bb]">
            {child.photo ? (
              <img src={child.photo} alt="" className="size-full object-cover" />
            ) : (
              <Icon className="size-9 text-white">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
              </Icon>
            )}
          </div>
          <div className="flex flex-col items-start gap-1 pt-1 text-right">
            <h3 className="whitespace-nowrap text-[14px] font-medium leading-[17px] tracking-[-0.14px] text-[#00033d]">
              {child.name}
            </h3>
            <p className="text-[12px] leading-[14px] tracking-[-0.12px] text-[#8e929f]">
              {formatDate(child.date)}
            </p>
          </div>
        </div>
        <StatusBadge child={child} />
      </div>

      <div className="mt-4 border-t-[0.6px] border-[#ebebf0]" />

      <div className="mt-2 flex h-[18px] items-center justify-between text-[12px] leading-[15px] text-[#8e929f]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Icon className="size-5">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </Icon>
            <span>אגף {child.wing}</span>
          </span>
          <span className="flex items-center gap-1">
            <Icon className="size-5">
              <line x1="10" x2="14" y1="2" y2="2" />
              <line x1="12" x2="15" y1="14" y2="11" />
              <circle cx="12" cy="14" r="8" />
            </Icon>
            <span>{child.minutes} דקות</span>
          </span>
        </div>
        <span className="flex items-center gap-1.5 text-[#bd4d00]">
          <Icon className="size-5">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4.5" />
            <path d="M12 16v.01" />
          </Icon>
          <span>קיים פער בנתונים בסלקום</span>
        </span>
      </div>
    </article>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50" style={{ animation: "fadeIn 200ms ease-out" }}>
      <button
        type="button"
        aria-label="סגירה"
        onClick={onClose}
        className="absolute inset-0 bg-[#00033d]/40"
      />
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
            <Icon>
              <path d="M18 6 6 18M6 6l12 12" />
            </Icon>
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-9 rounded-full border px-4 text-[14px] font-medium transition-colors ${
        active ? "border-[#00033d] bg-[#00033d] text-white" : "border-[#ededed] bg-white text-[#00033d]"
      }`}
    >
      {children}
    </button>
  );
}

export default function ChildrenList() {
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]["value"]>("all");
  const [wingFilter, setWingFilter] = useState<(typeof WING_OPTIONS)[number]["value"]>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<Direction>("desc");
  const [drawer, setDrawer] = useState<Drawer | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (searching) searchRef.current?.focus();
  }, [searching]);

  useEffect(() => {
    if (!drawer) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawer(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawer]);

  const visibleChildren = useMemo(() => {
    const term = query.trim();
    const factor = sortDir === "asc" ? 1 : -1;
    return CHILDREN.filter(
      (child) =>
        (statusFilter === "all" || child.status === statusFilter) &&
        (wingFilter === "all" || child.wing === wingFilter) &&
        (term === "" || child.name.includes(term)),
    ).sort((a, b) => factor * compareBy(a, b, sortKey));
  }, [query, statusFilter, wingFilter, sortKey, sortDir]);

  const activeFilters = Number(statusFilter !== "all") + Number(wingFilter !== "all");
  const filterLabel = activeFilters ? `סינון (${activeFilters})` : "סינון";

  const openDrawer = (next: Drawer) => {
    searchRef.current?.blur();
    setDrawer(next);
  };
  const closeDrawer = () => setDrawer(null);

  const closeSearch = (restoreFocus: boolean) => {
    setSearching(false);
    setQuery("");
    if (restoreFocus) requestAnimationFrame(() => searchButtonRef.current?.focus());
  };

  return (
    <div dir="rtl" lang="he" className="min-h-screen bg-[#f6f8fe] font-['Rubik'] text-[#00033d]">
      <style>{STYLES}</style>

      <main className="mx-auto flex min-h-screen w-full max-w-[375px] flex-col pb-10 pt-[50px]">
        <header className="flex h-[34px] items-center justify-between gap-2 px-5">
          <h1
            className={
              searching ? "sr-only" : "whitespace-nowrap pr-[3px] text-[18px] font-medium leading-[23px]"
            }
          >
            רשימת חניכים
          </h1>
          {searching && (
            <SearchField
              inputRef={searchRef}
              value={query}
              label="חיפוש חניכים"
              placeholder="חיפוש לפי שם או מספר"
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
            <ToolbarButton
              label={filterLabel}
              showLabel={!searching}
              active={activeFilters > 0}
              onClick={() => openDrawer("filter")}
            >
              <Icon strokeWidth={1.5}>
                <path d="M4 4h16v2.172a2 2 0 0 1-.586 1.414L15 12v7l-6 2v-8.5L4.52 7.572A2 2 0 0 1 4 6.227V4z" />
              </Icon>
            </ToolbarButton>
            <ToolbarButton label="מיון" showLabel={!searching} onClick={() => openDrawer("sort")}>
              <Icon strokeWidth={1.5}>
                <path d="M7 3v18" />
                <path d="M10 6 7 3 4 6" />
                <path d="m20 18-3 3-3-3" />
                <path d="M17 21V3" />
              </Icon>
            </ToolbarButton>
          </div>
        </header>

        <ul className="mt-3 flex flex-col gap-3 px-5">
          {visibleChildren.map((child) => (
            <li key={child.id}>
              <Link to={`/child/${child.id}`} className="block">
                <ChildCard child={child} />
              </Link>
            </li>
          ))}
        </ul>

        {visibleChildren.length === 0 && (
          <p className="mt-16 text-center text-[16px] leading-5 text-[#8e929f]">לא נמצאו חניכים</p>
        )}
      </main>

      {drawer === "filter" && (
        <Sheet title="סינון" onClose={closeDrawer}>
          <h3 className="mb-3 text-[14px] font-medium text-[#8e929f]">סטטוס</h3>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => (
              <Chip key={option.value} active={statusFilter === option.value} onClick={() => setStatusFilter(option.value)}>
                {option.label}
              </Chip>
            ))}
          </div>
          <h3 className="mb-3 mt-6 text-[14px] font-medium text-[#8e929f]">אגף</h3>
          <div className="flex flex-wrap gap-2">
            {WING_OPTIONS.map((option) => (
              <Chip key={option.value} active={wingFilter === option.value} onClick={() => setWingFilter(option.value)}>
                {option.label}
              </Chip>
            ))}
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="mt-8 h-12 w-full rounded-[30px] bg-[#00033d] text-[16px] font-medium text-white"
          >
            הצג תוצאות ({visibleChildren.length})
          </button>
        </Sheet>
      )}

      {drawer === "sort" && (
        <Sheet title="מיון" onClose={closeDrawer}>
          <div className="flex flex-col">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSortKey(option.value)}
                className="flex h-14 items-center justify-between border-b border-[#ededed] text-[16px] text-[#00033d]"
              >
                <span>{option.label}</span>
                {sortKey === option.value && (
                  <Icon className="text-[#00033d]">
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
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              aria-label="הוספה"
              className="flex size-14 items-center justify-center rounded-full bg-[#00033d] text-white"
            >
              <Icon className="size-6 text-white">
                <path d="M12 5v14M5 12h14" />
              </Icon>
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
