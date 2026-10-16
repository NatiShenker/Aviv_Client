import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import NotFound from "./NotFound";

interface Child {
  id: number;
  name: string;
}

const CHILDREN: Child[] = [
  { id: 1, name: "יוסי כהן" },
  { id: 2, name: "יוסי כהן" },
  { id: 3, name: "יוסי כהן" },
  { id: 4, name: "יוסי כהן" },
  { id: 5, name: "יוסי כהן" },
];

const STYLES = `@import url("https://fonts.googleapis.com/css2?family=Rubik:wght@400;500&display=swap");`;

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
      className={`shrink-0 ${className}`}
    >
      {children}
    </svg>
  );
}

function ActionCard({
  label,
  icon,
  bordered = false,
  to,
}: {
  label: string;
  icon: ReactNode;
  bordered?: boolean;
  to?: string;
}) {
  const className = `flex h-[60px] w-full items-center gap-3 rounded-[8px] bg-white px-3 text-right ${
    bordered ? "border border-[#e6e9f0]" : ""
  }`;
  const content = (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[50px] bg-[#e0ebff] text-[#00033d]">
        <Icon className="size-5">{icon}</Icon>
      </span>
      <span className="flex-1 text-[16px] leading-5 text-[#00033d]">{label}</span>
      <Icon className="size-6 text-[#00033d]">
        <path d="m15 18-6-6 6-6" />
      </Icon>
    </>
  );

  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" className={className}>
      {content}
    </button>
  );
}

const ACTIONS = [
  {
    label: "הגבלה/היתר לחניך",
    path: "block",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M5.6 18.4 18.4 5.6" />
      </>
    ),
  },
  {
    label: "הגבלה/היתר למספר",
    path: "exception",
    icon: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 7.46-2" />
        <circle cx="12" cy="16" r="1.2" />
      </>
    ),
  },
  {
    label: "הוספת הודעה קולית",
    path: "voice-message",
    icon: (
      <>
        <rect x="6.5" y="4" width="6" height="10" rx="3" />
        <path d="M3.5 11a6 6 0 0 0 12 0M9.5 17v4M6.5 21h6" />
        <path d="M18.5 2.5v6M15.5 5.5h6" />
      </>
    ),
  },
];

export default function ChildDetails() {
  const { id } = useParams();
  const child = CHILDREN.find((item) => String(item.id) === id);

  if (!child) return <NotFound />;

  return (
    <div dir="rtl" lang="he" className="min-h-screen bg-[#f6f8fe] font-['Rubik'] text-[#00033d]">
      <style>{STYLES}</style>

      <main className="mx-auto flex min-h-screen w-full max-w-[375px] flex-col">
        <header className="px-4 pt-[50px]">
          <div className="flex h-6 items-center">
            <Link to="/" aria-label="חזרה" className="flex size-6 shrink-0 items-center justify-center">
              <Icon className="size-6 text-[#00033d]" strokeWidth={1.5}>
                <path d="M14.43 5.93 20.5 12l-6.07 6.07" />
                <path d="M3.5 12h16.83" />
              </Icon>
            </Link>
            <h1 className="mr-4 flex-1 pl-[55px] text-right text-[20px] font-medium leading-6">
              {child.name}
            </h1>
          </div>
        </header>

        <div className="mx-4 mt-[17px] h-px bg-[#ededed]" />

        <section className="px-[19px]">
          <h2 className="mt-[31px] text-[16px] leading-5 tracking-[-0.16px]">פעולות</h2>
          <div className="mt-[15px] flex flex-col gap-1">
            {ACTIONS.map((action) => (
              <ActionCard
                key={action.label}
                label={action.label}
                icon={action.icon}
                to={`/child/${child.id}/${action.path}`}
                bordered
              />
            ))}
          </div>
        </section>

        <div className="mx-4 mt-6 h-px bg-[#ededed]" />

        <section className="px-[19px]">
          <h2 className="mt-[23px] text-[16px] font-medium leading-5">מידע נוסף</h2>
          <div className="mt-[15px]">
            <ActionCard
              label="הסטורית דקות"
              icon={
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </>
              }
            />
          </div>
        </section>
      </main>
    </div>
  );
}
