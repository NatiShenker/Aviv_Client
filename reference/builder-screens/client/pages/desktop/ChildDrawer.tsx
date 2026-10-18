import * as Dialog from "@radix-ui/react-dialog";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { NumberRecord, TraineeRestriction } from "@/lib/restrictions";
import type { VoiceMessageRecord } from "@/lib/voice-messages";
import DrawerActions from "./DrawerActions";
import DrawerBlockForm from "./DrawerBlockForm";
import DrawerBlockList from "./DrawerBlockList";
import DrawerExceptionForm from "./DrawerExceptionForm";
import DrawerExceptionList from "./DrawerExceptionList";
import DrawerVoiceMessageForm from "./DrawerVoiceMessageForm";
import DrawerVoiceMessageList from "./DrawerVoiceMessageList";
import type { DrawerAction } from "./drawer-actions";

export type DrawerScreen =
  | { name: "actions" }
  | { name: "list"; action: "block"; saved?: TraineeRestriction }
  | { name: "list"; action: "exception"; saved?: NumberRecord[] }
  | { name: "list"; action: "voice-message"; saved?: VoiceMessageRecord }
  | { name: "form"; action: "block"; record?: TraineeRestriction }
  | { name: "form"; action: "exception"; record?: NumberRecord }
  | { name: "form"; action: "voice-message"; record?: VoiceMessageRecord };

export interface DrawerChild {
  id: number;
  name: string;
  number: string;
  status: "active" | "blocked";
  blockedUntil?: string;
}

const STYLES = `
@import url("https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap");
[data-desktop] button:not(:disabled) { cursor: pointer; }
`;

const TEXT_INPUT_TYPES = ["text", "search", "tel", "email", "number"];

// Escape inside a text field belongs to the field (e.g. closing search), not the drawer
const isTextEntry = (target: EventTarget | null) =>
  target instanceof HTMLTextAreaElement ||
  (target instanceof HTMLInputElement && TEXT_INPUT_TYPES.includes(target.type));

function StatusBadge({ child }: { child: DrawerChild }) {
  const blocked = child.status === "blocked";
  return (
    <span
      className={`flex h-8 shrink-0 items-center gap-2 rounded-full px-3 text-[16px] font-medium leading-5 ${
        blocked ? "bg-[#ffe8e8] text-[#d4262b]" : "bg-[#e7ffef] text-[#15833a]"
      }`}
    >
      <span className={`size-2 rounded-full ${blocked ? "bg-[#ff3b3b]" : "bg-[#22c55e]"}`} />
      {blocked ? `מוגבל עד ${child.blockedUntil}` : "פעיל"}
    </span>
  );
}

export default function ChildDrawer({
  child,
  open,
  screen,
  returnFocus,
  onOpenChange,
  onNavigate,
}: {
  child: DrawerChild;
  open: boolean;
  screen: DrawerScreen;
  returnFocus: HTMLElement | null;
  onOpenChange: (open: boolean) => void;
  onNavigate: (screen: DrawerScreen) => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const childId = String(child.id);

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [screen]);

  const toActions = () => onNavigate({ name: "actions" });
  const toList = (action: DrawerAction) => onNavigate({ name: "list", action });

  let content: ReactNode;
  if (screen.name === "actions") {
    content = <DrawerActions onSelectAction={toList} />;
  } else if (screen.name === "list") {
    const listProps = { childId, onBack: toActions, onSwitchAction: toList };
    if (screen.action === "block") {
      content = (
        <DrawerBlockList
          {...listProps}
          saved={screen.saved}
          onNew={() => onNavigate({ name: "form", action: "block" })}
          onEdit={(record) => onNavigate({ name: "form", action: "block", record })}
        />
      );
    } else if (screen.action === "exception") {
      content = (
        <DrawerExceptionList
          {...listProps}
          saved={screen.saved}
          onNew={() => onNavigate({ name: "form", action: "exception" })}
          onEdit={(record) => onNavigate({ name: "form", action: "exception", record })}
        />
      );
    } else {
      content = (
        <DrawerVoiceMessageList
          {...listProps}
          saved={screen.saved}
          onNew={() => onNavigate({ name: "form", action: "voice-message" })}
          onEdit={(record) => onNavigate({ name: "form", action: "voice-message", record })}
        />
      );
    }
  } else if (screen.action === "block") {
    content = (
      <DrawerBlockForm
        key={screen.record?.id ?? "new"}
        record={screen.record}
        onClose={() => toList("block")}
        onSaved={(saved) => onNavigate({ name: "list", action: "block", saved })}
      />
    );
  } else if (screen.action === "exception") {
    content = (
      <DrawerExceptionForm
        key={screen.record?.id ?? "new"}
        childId={childId}
        record={screen.record}
        onClose={() => toList("exception")}
        onSaved={(saved) => onNavigate({ name: "list", action: "exception", saved })}
      />
    );
  } else {
    content = (
      <DrawerVoiceMessageForm
        key={screen.record?.id ?? "new"}
        childName={child.name}
        record={screen.record}
        onClose={() => toList("voice-message")}
        onSaved={(saved) => onNavigate({ name: "list", action: "voice-message", saved })}
      />
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#00033d]/40 duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content
          ref={contentRef}
          dir="rtl"
          lang="he"
          data-desktop=""
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            contentRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            if (!returnFocus?.isConnected) return;
            event.preventDefault();
            returnFocus.focus();
          }}
          onEscapeKeyDown={(event) => {
            if (isTextEntry(event.target)) event.preventDefault();
          }}
          className="fixed inset-y-0 left-0 z-50 flex w-[40vw] min-w-[560px] flex-col bg-white font-['Rubik'] text-[#00033d] shadow-[8px_0_32px_rgba(0,3,61,0.16)] outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-left data-[state=open]:duration-300 data-[state=open]:ease-out data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=closed]:duration-200 data-[state=closed]:ease-in"
        >
          <style>{STYLES}</style>

          <header className="flex shrink-0 items-start justify-between gap-4 px-8 pb-8 pt-10">
            <div className="flex min-w-0 items-start gap-3.5">
              <div className="flex size-[86px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-gradient-to-b from-[#d5dce9] to-[#9aa5bb]">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-12 text-white"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
                </svg>
              </div>
              <div className="min-w-0 pt-2">
                <Dialog.Title className="truncate text-[28px] font-bold leading-[34px]">{child.name}</Dialog.Title>
                <p className="mt-1 text-[16px] leading-5 text-[#8e929f]">{child.number}</p>
              </div>
            </div>
            <StatusBadge child={child} />
          </header>

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-8">
            {content}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
