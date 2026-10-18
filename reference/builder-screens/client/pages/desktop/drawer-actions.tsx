import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { ReactNode } from "react";

export type DrawerAction = "block" | "exception" | "voice-message";

interface ActionDefinition {
  key: DrawerAction;
  label: string;
  newLabel: string;
  icon: ReactNode;
}

export const DRAWER_ACTIONS: ActionDefinition[] = [
  {
    key: "block",
    label: "הגבלה/היתר לחניך",
    newLabel: "הגבלה חדשה",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M5.6 18.4 18.4 5.6" />
      </>
    ),
  },
  {
    key: "exception",
    label: "הגבלה/היתר למספר",
    newLabel: "הוספת הגבלה/היתר",
    icon: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 7.46-2" />
        <circle cx="12" cy="16" r="1.2" />
      </>
    ),
  },
  {
    key: "voice-message",
    label: "הוספת הודעה קולית",
    newLabel: "הוספת הודעה קולית חדשה",
    icon: (
      <>
        <rect x="6.5" y="4" width="6" height="10" rx="3" />
        <path d="M3.5 11a6 6 0 0 0 12 0M9.5 17v4M6.5 21h6" />
        <path d="M18.5 2.5v6M15.5 5.5h6" />
      </>
    ),
  },
];

const actionOf = (key: DrawerAction) => DRAWER_ACTIONS.find((action) => action.key === key)!;

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
      className={`shrink-0 ${/(^|\s)size-/.test(className) ? "" : "size-6"} ${className}`}
    >
      {children}
    </svg>
  );
}

export function ActionBadge({ action, small = false }: { action: DrawerAction; small?: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#e0ebff] text-[#00033d] ${
        small ? "size-8" : "size-9"
      }`}
    >
      <Icon className={small ? "size-[18px]" : "size-5"}>{actionOf(action).icon}</Icon>
    </span>
  );
}

export function DrawerActionBar({
  action,
  onBack,
  onSwitchAction,
  onNew,
}: {
  action: DrawerAction;
  onBack: () => void;
  onSwitchAction: (action: DrawerAction) => void;
  onNew: () => void;
}) {
  const current = actionOf(action);

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="חזרה לפעולות"
          onClick={onBack}
          className="-ms-2 flex size-10 shrink-0 items-center justify-center rounded-full text-[#00033d] outline-none transition-colors hover:bg-[#f6f8fe] focus-visible:ring-2 focus-visible:ring-[#006aff]/40"
        >
          <Icon strokeWidth={1.5}>
            <path d="M14.43 5.93 20.5 12l-6.07 6.07" />
            <path d="M3.5 12h16.83" />
          </Icon>
        </button>

        <DropdownMenu.Root dir="rtl">
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="group flex h-12 min-w-0 items-center gap-2 rounded-[8px] pl-2 pr-1.5 text-[16px] leading-5 text-[#00033d] outline-none transition-colors hover:bg-[#f6f8fe] focus-visible:ring-2 focus-visible:ring-[#006aff]/40 data-[state=open]:bg-[#f6f8fe]"
            >
              <ActionBadge action={action} />
              <span className="truncate">
                <span className="sr-only">החלפת פעולה, הפעולה הנוכחית: </span>
                {current.label}
              </span>
              <Icon className="size-5 transition-transform duration-200 group-data-[state=open]:rotate-180">
                <path d="m6 9 6 6 6-6" />
              </Icon>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              sideOffset={6}
              className="z-[60] min-w-[260px] rounded-[12px] border border-[#e6e9f0] bg-white p-1.5 font-['Rubik'] text-[#00033d] shadow-[0_8px_24px_rgba(0,3,61,0.12)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
            >
              <DropdownMenu.RadioGroup
                value={action}
                onValueChange={(value) => value !== action && onSwitchAction(value as DrawerAction)}
              >
                {DRAWER_ACTIONS.map((item) => (
                  <DropdownMenu.RadioItem
                    key={item.key}
                    value={item.key}
                    className="flex h-12 cursor-pointer select-none items-center gap-3 rounded-[8px] px-2.5 text-[16px] leading-5 outline-none data-[highlighted]:bg-[#f6f8fe]"
                  >
                    <ActionBadge action={item.key} small />
                    <span className="flex-1 whitespace-nowrap">{item.label}</span>
                    <DropdownMenu.ItemIndicator>
                      <Icon className="size-5 text-[#006aff]">
                        <path d="M20 6 9 17l-5-5" />
                      </Icon>
                    </DropdownMenu.ItemIndicator>
                  </DropdownMenu.RadioItem>
                ))}
              </DropdownMenu.RadioGroup>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <button
        type="button"
        onClick={onNew}
        className="flex h-12 shrink-0 items-center justify-center gap-1 rounded-[8px] bg-[#006aff] px-5 text-[16px] font-semibold leading-5 text-white outline-none transition-colors hover:bg-[#0058d6] focus-visible:ring-2 focus-visible:ring-[#006aff]/40 focus-visible:ring-offset-2"
      >
        <span className="whitespace-nowrap">{current.newLabel}</span>
        <Icon strokeWidth={1.5}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </Icon>
      </button>
    </div>
  );
}
