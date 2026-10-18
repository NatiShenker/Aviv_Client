import * as Tabs from "@radix-ui/react-tabs";
import type { ReactNode } from "react";
import { ActionBadge, DRAWER_ACTIONS, type DrawerAction } from "./drawer-actions";

function Icon({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${/(^|\s)size-/.test(className) ? "" : "size-5"} ${className}`}
    >
      {children}
    </svg>
  );
}

function Tab({ value, label, icon }: { value: string; label: string; icon: ReactNode }) {
  return (
    <Tabs.Trigger
      value={value}
      className="relative flex h-12 flex-1 items-center justify-center gap-2 text-[16px] leading-5 text-[#00033d] outline-none transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full after:bg-transparent after:transition-colors hover:bg-[#f6f8fe] focus-visible:bg-[#f6f8fe] data-[state=active]:font-medium data-[state=active]:after:bg-[#006aff]"
    >
      <Icon>{icon}</Icon>
      <span>{label}</span>
    </Tabs.Trigger>
  );
}

export default function DrawerActions({ onSelectAction }: { onSelectAction: (action: DrawerAction) => void }) {
  return (
    <Tabs.Root dir="rtl" defaultValue="actions" className="pb-8">
      <Tabs.List aria-label="תפריט החניך" className="flex shadow-[inset_0_-1px_0_#dfe3ec]">
        <Tab
          value="actions"
          label="פעולות"
          icon={
            <>
              <rect x="4" y="4" width="6" height="6" rx="1.5" />
              <rect x="14" y="4" width="6" height="6" rx="1.5" />
              <rect x="4" y="14" width="6" height="6" rx="1.5" />
              <rect x="14" y="14" width="6" height="6" rx="1.5" />
            </>
          }
        />
        <Tab
          value="history"
          label="הסטוריה"
          icon={
            <>
              <path d="M12 8v4l2 2" />
              <path d="M3.05 11a9 9 0 1 1 .5 4M3 4v4h4" />
            </>
          }
        />
      </Tabs.List>

      <Tabs.Content value="actions" className="mt-10 outline-none">
        <ul className="flex flex-col gap-4">
          {DRAWER_ACTIONS.map((action) => (
            <li key={action.key}>
              <button
                type="button"
                onClick={() => onSelectAction(action.key)}
                className="flex h-[76px] w-full items-center gap-3 rounded-[8px] border border-[#e6e9f0] bg-white px-4 text-right outline-none transition-colors hover:border-[#c5cbdd] hover:bg-[#fafbff] focus-visible:border-[#006aff]"
              >
                <ActionBadge action={action.key} />
                <span className="flex-1 text-[16px] leading-5 text-[#00033d]">{action.label}</span>
                <Icon className="size-6 text-[#00033d]">
                  <path d="m15 18-6-6 6-6" />
                </Icon>
              </button>
            </li>
          ))}
        </ul>
      </Tabs.Content>

      <Tabs.Content value="history" className="mt-16 flex flex-col items-center gap-4 outline-none">
        <span className="flex size-14 items-center justify-center rounded-full bg-[#f6f8fe] text-[#8e929f]">
          <Icon className="size-7">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </Icon>
        </span>
        <p className="text-center text-[16px] leading-5 text-[#8e929f]">אין עדיין היסטוריית דקות</p>
      </Tabs.Content>
    </Tabs.Root>
  );
}
