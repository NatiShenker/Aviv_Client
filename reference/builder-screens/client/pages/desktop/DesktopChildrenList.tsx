import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useId, useMemo, useRef, useState, type ReactNode } from "react";
import ChildDrawer, { type DrawerScreen } from "./ChildDrawer";
import { ActionBadge, DRAWER_ACTIONS } from "./drawer-actions";

type Status = "active" | "blocked";
type Wing = "א" | "ב" | "ג";
type SortKey = "name" | "date" | "time";
type Direction = "asc" | "desc";

interface Child {
  id: number;
  name: string;
  number: string;
  date: string;
  status: Status;
  blockedUntil?: string;
  minutes: number;
  wing: Wing;
  photo?: string;
}

interface DrawerState {
  childId: number;
  screen: DrawerScreen;
  returnFocus: HTMLElement | null;
}

const CHILDREN: Child[] = [
  { id: 1, name: "יוסי כהן", number: "012453", date: "2023-04-16", status: "active", minutes: 45, wing: "א" },
  { id: 2, name: "דניאל לוי", number: "013872", date: "2023-04-15", status: "blocked", blockedUntil: "25/06", minutes: 30, wing: "א" },
  { id: 3, name: "איתי מזרחי", number: "011208", date: "2023-04-16", status: "active", minutes: 60, wing: "ב" },
  { id: 4, name: "נועם פרץ", number: "014590", date: "2023-04-12", status: "active", minutes: 15, wing: "ג" },
  { id: 5, name: "עומר ביטון", number: "012961", date: "2023-04-14", status: "blocked", blockedUntil: "02/07", minutes: 20, wing: "ב" },
  { id: 6, name: "אריאל אברהם", number: "015327", date: "2023-04-13", status: "active", minutes: 50, wing: "א" },
  { id: 7, name: "רועי פרידמן", number: "013104", date: "2023-04-11", status: "active", minutes: 35, wing: "ג" },
  { id: 8, name: "אורי דהן", number: "016742", date: "2023-04-16", status: "blocked", blockedUntil: "18/06", minutes: 10, wing: "א" },
  { id: 9, name: "אלון שפירא", number: "012085", date: "2023-04-10", status: "active", minutes: 55, wing: "ב" },
  { id: 10, name: "יונתן אזולאי", number: "014418", date: "2023-04-15", status: "active", minutes: 40, wing: "ג" },
  { id: 11, name: "מתן גבאי", number: "017263", date: "2023-04-09", status: "blocked", blockedUntil: "30/06", minutes: 25, wing: "ב" },
  { id: 12, name: "עידו חדד", number: "015896", date: "2023-04-14", status: "active", minutes: 45, wing: "א" },
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
@import url("https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap");
[data-desktop] button:not(:disabled) { cursor: pointer; }
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

const CloseIcon = ({ className = "" }: { className?: string }) => (
  <Icon className={className} strokeWidth={1.5}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Icon>
);

function FilterLabel({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <span id={id} className="block text-[14px] leading-[18px] text-[#8e929f]">
      {children}
    </span>
  );
}

function SelectBox<T extends string>({
  value,
  options,
  labelledBy,
  onChange,
}: {
  value: T;
  options: readonly { value: NoInfer<T>; label: string }[];
  labelledBy?: string;
  onChange: (value: NoInfer<T>) => void;
}) {
  return (
    <span className="relative block">
      <select
        value={value}
        aria-labelledby={labelledBy}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-10 w-full cursor-pointer appearance-none rounded-[8px] border border-[#dfe3ec] bg-white pl-10 pr-3 text-right text-[16px] leading-5 text-[#00033d] outline-none transition-colors hover:border-[#c5cbdd] focus:border-[#006aff]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#00033d]">
        <path d="m6 9 6 6 6-6" />
      </Icon>
    </span>
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

const MENU_ITEM_CLASS =
  "flex h-12 cursor-pointer select-none items-center gap-3 rounded-[8px] px-2.5 text-[16px] leading-5 outline-none data-[highlighted]:bg-[#f6f8fe]";

function ChildMenu({ child, onOpen }: { child: Child; onOpen: (screen: DrawerScreen, returnFocus: HTMLElement) => void }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const open = (screen: DrawerScreen) => onOpen(screen, triggerRef.current);

  return (
    <DropdownMenu.Root dir="rtl">
      <DropdownMenu.Trigger asChild>
        <button
          ref={triggerRef}
          type="button"
          aria-label={`פעולות עבור ${child.name}`}
          className="relative z-10 -my-1 -ml-1.5 flex size-8 items-center justify-center rounded-full text-[#00033d] outline-none transition-colors hover:bg-[#f6f8fe] focus-visible:ring-2 focus-visible:ring-[#006aff]/40 data-[state=open]:bg-[#e0ebff]"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-5">
            <circle cx="12" cy="5" r="1.75" />
            <circle cx="12" cy="12" r="1.75" />
            <circle cx="12" cy="19" r="1.75" />
          </svg>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          collisionPadding={16}
          className="z-50 min-w-[260px] rounded-[12px] border border-[#e6e9f0] bg-white p-1.5 font-['Rubik'] text-[#00033d] shadow-[0_8px_24px_rgba(0,3,61,0.12)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          {DRAWER_ACTIONS.map((action) => (
            <DropdownMenu.Item
              key={action.key}
              onSelect={() => open({ name: "list", action: action.key })}
              className={MENU_ITEM_CLASS}
            >
              <ActionBadge action={action.key} small />
              <span className="whitespace-nowrap">{action.label}</span>
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="mx-1 my-1 h-px bg-[#ededed]" />
          <DropdownMenu.Item onSelect={() => open({ name: "actions" })} className={MENU_ITEM_CLASS}>
            <span className="flex size-8 shrink-0 items-center justify-center text-[#00033d]">
              <Icon className="size-[18px]">
                <rect x="4" y="4" width="6" height="6" rx="1.5" />
                <rect x="14" y="4" width="6" height="6" rx="1.5" />
                <rect x="4" y="14" width="6" height="6" rx="1.5" />
                <rect x="14" y="14" width="6" height="6" rx="1.5" />
              </Icon>
            </span>
            <span className="whitespace-nowrap">כל הפעולות</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function ChildCard({
  child,
  active,
  onOpen,
}: {
  child: Child;
  active: boolean;
  onOpen: (screen: DrawerScreen, returnFocus: HTMLElement) => void;
}) {
  return (
    <div className="group relative h-full">
      {/* Covers the card so the whole surface opens the drawer, while the menu button sits above it */}
      <button
        type="button"
        aria-label={`פתיחת הפעולות של ${child.name}`}
        onClick={(event) => onOpen({ name: "actions" }, event.currentTarget)}
        className="absolute inset-0 z-0 rounded-[19px] outline-none focus-visible:ring-2 focus-visible:ring-[#006aff] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      />
      <article
        className={`h-full rounded-[19px] border bg-white p-4 transition-[border-color,box-shadow] duration-200 ${
          active
            ? "border-[#006aff] shadow-[0_0_0_1px_#006aff]"
            : "border-[#e6e9f0] group-hover:border-[#c5cbdd] group-hover:shadow-[0_4px_16px_rgba(0,3,61,0.06)]"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-[11px]">
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
            <div className="flex min-w-0 flex-col items-start gap-1 pt-1 text-right">
              <h3 className="max-w-full truncate text-[14px] font-medium leading-[17px] tracking-[-0.14px] text-[#00033d]">
                {child.name} | {child.number}
              </h3>
              <p className="text-[12px] leading-[14px] tracking-[-0.12px] text-[#8e929f]">{formatDate(child.date)}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <StatusBadge child={child} />
            <ChildMenu child={child} onOpen={onOpen} />
          </div>
        </div>

        <div className="mt-4 border-t-[0.6px] border-[#ebebf0]" />

        <div className="mt-2 flex h-[18px] items-center justify-between gap-3 text-[12px] leading-[15px] text-[#8e929f]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Icon className="size-5">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </Icon>
              <span>אגף {child.wing}</span>
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Icon className="size-5">
                <line x1="10" x2="14" y1="2" y2="2" />
                <line x1="12" x2="15" y1="14" y2="11" />
                <circle cx="12" cy="14" r="8" />
              </Icon>
              <span>{child.minutes} דקות</span>
            </span>
          </div>
          <span className="flex items-center gap-1.5 whitespace-nowrap text-[#bd4d00]">
            <Icon className="size-5">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4.5" />
              <path d="M12 16v.01" />
            </Icon>
            <span>קיים פער בנתונים בסלקום</span>
          </span>
        </div>
      </article>
    </div>
  );
}

export default function DesktopChildrenList() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]["value"]>("all");
  const [wingFilter, setWingFilter] = useState<(typeof WING_OPTIONS)[number]["value"]>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<Direction>("desc");
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  // Kept separate from `drawer` so its content stays rendered while the panel slides out
  const [drawerOpen, setDrawerOpen] = useState(false);
  const statusLabelId = useId();
  const wingLabelId = useId();
  const sortLabelId = useId();

  const visibleChildren = useMemo(() => {
    const term = query.trim();
    const factor = sortDir === "asc" ? 1 : -1;
    return CHILDREN.filter(
      (child) =>
        (statusFilter === "all" || child.status === statusFilter) &&
        (wingFilter === "all" || child.wing === wingFilter) &&
        (term === "" || `${child.name} ${child.number}`.includes(term)),
    ).sort((a, b) => factor * compareBy(a, b, sortKey));
  }, [query, statusFilter, wingFilter, sortKey, sortDir]);

  const hasFilters = query.trim() !== "" || statusFilter !== "all" || wingFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setWingFilter("all");
  };

  const openDrawer = (childId: number, screen: DrawerScreen, returnFocus: HTMLElement | null) => {
    setDrawer({ childId, screen, returnFocus });
    setDrawerOpen(true);
  };

  const navigateDrawer = (screen: DrawerScreen) => setDrawer((current) => current && { ...current, screen });

  const drawerChild = drawer && CHILDREN.find((child) => child.id === drawer.childId);

  return (
    <div dir="rtl" lang="he" data-desktop="" className="min-h-screen bg-[#f6f8fe] font-['Rubik'] text-[#00033d]">
      <style>{STYLES}</style>

      <main className="mx-auto w-full px-[clamp(24px,5.2vw,100px)] pb-16 pt-10">
        <h1 className="text-[32px] font-medium leading-10">רשימת חניכים</h1>

        <section
          aria-label="סינון ומיון"
          className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-4 rounded-[16px] bg-white px-6 py-5"
        >
          <label className="block w-[320px]">
            <FilterLabel>חיפוש</FilterLabel>
            <span className="relative mt-1.5 block">
              <Icon
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8e929f]"
                strokeWidth={1.5}
              >
                <circle cx="10" cy="10" r="7" />
                <path d="m21 21-6-6" />
              </Icon>
              <input
                type="search"
                placeholder="חיפוש לפי שם או מספר"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => event.key === "Escape" && setQuery("")}
                className="h-10 w-full rounded-[8px] border border-[#dfe3ec] bg-white pl-10 pr-10 text-right text-[16px] leading-5 text-[#00033d] outline-none transition-colors placeholder:text-[#8e929f] hover:border-[#c5cbdd] focus:border-[#006aff] [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  aria-label="ניקוי החיפוש"
                  onClick={() => setQuery("")}
                  className="absolute inset-y-0 left-0 flex w-10 items-center justify-center text-[#8e929f] transition-colors hover:text-[#00033d]"
                >
                  <CloseIcon className="size-[18px]" />
                </button>
              )}
            </span>
          </label>

          <div>
            <FilterLabel id={statusLabelId}>סטטוס</FilterLabel>
            <div role="group" aria-labelledby={statusLabelId} className="mt-1.5 flex h-10 gap-1 rounded-[8px] bg-[#f6f8fe] p-1">
              {STATUS_OPTIONS.map((option) => {
                const active = statusFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStatusFilter(option.value)}
                    className={`h-8 min-w-[64px] rounded-[6px] px-4 text-[14px] leading-[18px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#006aff]/40 ${
                      active
                        ? "bg-white font-medium text-[#00033d] shadow-[0_1px_3px_rgba(0,3,61,0.12)]"
                        : "text-[#8e929f] hover:text-[#00033d]"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-[180px]">
            <FilterLabel id={wingLabelId}>אגף</FilterLabel>
            <div className="mt-1.5">
              <SelectBox value={wingFilter} options={WING_OPTIONS} labelledBy={wingLabelId} onChange={setWingFilter} />
            </div>
          </div>

          <div>
            <FilterLabel id={sortLabelId}>מיון</FilterLabel>
            <div className="mt-1.5 flex gap-2">
              <div className="w-[180px]">
                <SelectBox value={sortKey} options={SORT_OPTIONS} labelledBy={sortLabelId} onChange={setSortKey} />
              </div>
              <button
                type="button"
                aria-label={`כיוון מיון: ${sortDir === "asc" ? "עולה" : "יורד"}`}
                onClick={() => setSortDir((dir) => (dir === "asc" ? "desc" : "asc"))}
                className="flex h-10 items-center gap-1.5 rounded-[8px] border border-[#dfe3ec] bg-white px-3 text-[14px] leading-[18px] text-[#00033d] outline-none transition-colors hover:border-[#c5cbdd] focus-visible:border-[#006aff]"
              >
                <Icon className={`size-4 transition-transform duration-200 ${sortDir === "desc" ? "rotate-180" : ""}`}>
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </Icon>
                <span>{sortDir === "asc" ? "עולה" : "יורד"}</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={!hasFilters}
            onClick={clearFilters}
            className="ms-auto flex h-10 items-center gap-1.5 rounded-[8px] px-3 text-[14px] font-medium leading-[18px] text-[#006aff] outline-none transition-colors hover:bg-[#f5f9ff] focus-visible:ring-2 focus-visible:ring-[#006aff]/40 disabled:text-[#c5cbdd] disabled:hover:bg-transparent"
          >
            <CloseIcon className="size-[18px]" />
            <span>נקה סינון</span>
          </button>
        </section>

        <section aria-label="חניכים" className="mt-6 rounded-[16px] bg-white p-6">
          {visibleChildren.length > 0 ? (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
              {visibleChildren.map((child) => (
                <li key={child.id}>
                  <ChildCard
                    child={child}
                    active={drawerOpen && drawer?.childId === child.id}
                    onOpen={(screen, returnFocus) => openDrawer(child.id, screen, returnFocus)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-16 text-center text-[16px] leading-5 text-[#8e929f]">לא נמצאו חניכים</p>
          )}
        </section>
      </main>

      {drawer && drawerChild && (
        <ChildDrawer
          child={drawerChild}
          open={drawerOpen}
          screen={drawer.screen}
          returnFocus={drawer.returnFocus}
          onOpenChange={setDrawerOpen}
          onNavigate={navigateDrawer}
        />
      )}
    </div>
  );
}
