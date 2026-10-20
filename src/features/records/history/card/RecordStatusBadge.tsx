import { HISTORY_TEXTS } from "../historyTexts";

interface RecordStatusBadgeProps {
  isActive: boolean;
  /** "פעילה" (הגבלה, הודעה קולית) או "פעיל" (היתר) */
  activeLabel: string;
}

/** תגית הסטטוס של רשומה בהיסטוריה: פעילה או הסתיימה (ספק 00 §3.18) */
export default function RecordStatusBadge({ isActive, activeLabel }: RecordStatusBadgeProps) {
  const toneClass = isActive ? "bg-success-soft text-success" : "bg-grey-50 text-border-strong";

  return (
    <span className={`flex h-5 shrink-0 items-center rounded-full px-2 text-xs ${toneClass}`}>
      {isActive ? activeLabel : HISTORY_TEXTS.card.endedBadge}
    </span>
  );
}
